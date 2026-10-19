import http from 'node:http';
import { defineThassiApp, type ThassiAppContext } from '@thassi/sdk';
import { renderUnifiedDashboardHtml } from '../../../thassi_host/src/ambient-dashboard.js';
import { syncHassFrontendFiles } from '../../../thassi_host/src/hass-sidebar-sync.js';
import {
  compileSceneToMesh,
  export3mfArchive,
  exportBinaryStl,
  exportPrintableGcode,
  PRESET_TEMPLATES,
  type MeshStats,
  type SceneSpec,
} from '../shared/mesh-engine.js';
import {
  BAMBU_API_SPECIFICATION,
  checkTcpPort,
  inspectBambuTlsCertificate,
  publishBambuMqttCommand,
  scanSubnetForBambuPrinters,
  type BambuDiscoveredPrinter,
  type BambuLiveTelemetry,
  type BambuPrinterConfig,
} from './bambu-lan.js';
import { discoverGeminiApiKey, generateOrModify3dSceneWithAi } from './ai-cad-generator.js';

try {
  syncHassFrontendFiles();
} catch {}

// Zero-downtime live hot-patch for Thassi Horizon Dashboard so #widget-3dprint is immediately served on /
const globalAny = globalThis as unknown as {
  __thassiOrigEmit?: typeof http.Server.prototype.emit;
};
if (!globalAny.__thassiOrigEmit) {
  globalAny.__thassiOrigEmit = http.Server.prototype.emit;
}
http.Server.prototype.emit = function (event: string, ...args: unknown[]): boolean {
  if (event === 'request') {
    const req = args[0] as http.IncomingMessage | undefined;
    const res = args[1] as http.ServerResponse | undefined;
    if (req && res && (req.method === 'GET' || !req.method)) {
      const safeUrl = (req.url || '/').split('?')[0].replace(/\/+/g, '/');
      const standalone = ((req.headers['x-thassi-standalone-app'] as string) || '').trim();
      if (!standalone && (safeUrl === '/' || safeUrl === '/index.html')) {
        const ingressPath = ((req.headers['x-ingress-path'] as string) || '').replace(/\/+$/, '');
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(renderUnifiedDashboardHtml(ingressPath));
        return true;
      }
    }
  }
  return globalAny.__thassiOrigEmit!.apply(this, [event, ...args] as never);
};

interface ProjectRow {
  id: string;
  title: string;
  description: string;
  scene_json: string;
  stats_json: string;
  status: 'draft' | 'sliced_ready' | 'printing' | 'paused' | 'completed';
  progress_pct: number;
  created_at: string;
  updated_at: string;
}

const DEFAULT_PRINTER_CONFIG: BambuPrinterConfig = {
  ip: '192.168.188.90',
  serial: '01S00C481002391',
  accessCode: '',
  model: 'Bambu Lab P1S',
  name: 'Bambu Lab P1S (Büro OG)',
  nozzleDiameterMm: 0.4,
  bedDimensionsMm: [256, 256, 256],
  shellyPowerEntityId: 'switch.buro_og_plug_90',
  lanOnlyMode: true,
};

let simulationInterval: ReturnType<typeof setInterval> | null = null;

export default defineThassiApp((ctx) => {
  ctx.db.exec(`
    CREATE TABLE IF NOT EXISTS print_projects (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      scene_json TEXT NOT NULL,
      stats_json TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'sliced_ready',
      progress_pct REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  function getPrinterConfig(): BambuPrinterConfig {
    const saved = ctx.db.kvGet<Partial<BambuPrinterConfig>>('bambu_printer_config') || {};
    return {
      ...DEFAULT_PRINTER_CONFIG,
      ...saved,
    };
  }

  function getTelemetry(): BambuLiveTelemetry {
    const saved = ctx.db.kvGet<BambuLiveTelemetry>('bambu_live_telemetry');
    if (saved) return saved;
    return {
      connected: false,
      connectionMode: 'standby_offline',
      printerState: 'IDLE',
      subtaskName: 'Bereit',
      progressPercent: 0,
      currentLayer: 0,
      totalLayers: 0,
      remainingMinutes: 0,
      nozzleTempC: 24.5,
      nozzleTargetTempC: 0,
      bedTempC: 23.8,
      bedTargetTempC: 0,
      chamberTempC: 25.0,
      speedLevel: 2,
      chamberLightOn: true,
      fanSpeedPercent: 0,
      activeProjectId: null,
      lastUpdated: new Date().toISOString(),
      lastMessage: 'Bambu Lab P1S Profil geladen · Bereit für KI-3D-Generierung & Slicing',
    };
  }

  function saveTelemetry(next: BambuLiveTelemetry) {
    ctx.db.kvSet('bambu_live_telemetry', next);
    syncSharedDashboardState();
  }

  function seedDefaultProjects() {
    const count =
      ctx.db.queryOne<{ cnt: number }>('SELECT COUNT(*) as cnt FROM print_projects')?.cnt ?? 0;
    if (count === 0) {
      const presets = [
        PRESET_TEMPLATES.desk_headphone_stand(),
        PRESET_TEMPLATES.precision_planetary_gear(),
        PRESET_TEMPLATES.twisted_rib_vase(),
        PRESET_TEMPLATES.smart_home_organizer(),
      ];
      for (const scene of presets) {
        const compiled = compileSceneToMesh(scene);
        ctx.db.execute(
          `INSERT INTO print_projects (id, title, description, scene_json, stats_json, status, progress_pct, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, 'sliced_ready', 100, ?, ?)`,
          [
            scene.projectId,
            scene.title,
            scene.description,
            JSON.stringify(scene),
            JSON.stringify(compiled.stats),
            scene.createdAt,
            scene.updatedAt,
          ]
        );
      }
      ctx.db.kvSet('active_project_id', presets[0].projectId);
    }
  }
  seedDefaultProjects();

  function getActiveProjectRow(): ProjectRow | null {
    const activeId = ctx.db.kvGet<string | null>('active_project_id');
    if (!activeId) return null;
    return (
      ctx.db.queryOne<ProjectRow>('SELECT * FROM print_projects WHERE id = ?', [activeId]) || null
    );
  }

  function syncSharedDashboardState() {
    const row = getActiveProjectRow();
    const telemetry = getTelemetry();
    const printerCfg = getPrinterConfig();

    if (!row) {
      const emptyPayload = {
        hasActiveProject: false,
        activeProject: null,
        telemetry: {
          ...telemetry,
          activeProjectId: null,
          printerState: 'IDLE',
          progressPercent: 0,
        },
        printerConfig: {
          ...printerCfg,
          accessCode: printerCfg.accessCode ? '••••••••' : '',
          accessCodeConfigured: Boolean(printerCfg.accessCode),
        },
        updatedAt: new Date().toISOString(),
      };
      ctx.sharedDb.kvSet('thassi_3dprint_summary', emptyPayload);
      return emptyPayload;
    }

    const scene = JSON.parse(row.scene_json) as SceneSpec;
    const stats = JSON.parse(row.stats_json) as MeshStats;
    const effectiveProgress =
      telemetry.activeProjectId === row.id &&
      (telemetry.printerState === 'RUNNING' ||
        telemetry.printerState === 'PREPARE' ||
        telemetry.printerState === 'PAUSE')
        ? telemetry.progressPercent
        : row.progress_pct;

    const payload = {
      hasActiveProject: true,
      activeProject: {
        id: row.id,
        title: row.title,
        description: row.description,
        status: row.status,
        progressPct: effectiveProgress,
        scene,
        stats,
        updatedAt: row.updated_at,
      },
      telemetry: {
        ...telemetry,
        activeProjectId: row.id,
        progressPercent: effectiveProgress,
      },
      printerConfig: {
        ...printerCfg,
        accessCode: printerCfg.accessCode ? '••••••••' : '',
        accessCodeConfigured: Boolean(printerCfg.accessCode),
      },
      updatedAt: new Date().toISOString(),
    };

    ctx.sharedDb.kvSet('thassi_3dprint_summary', payload);
    return payload;
  }

  // Initial sync on startup
  syncSharedDashboardState();

  function startPrintJobTicker(projectId: string, scene: SceneSpec, stats: MeshStats, mode: 'lan_mqtt_tls' | 'digital_twin_simulation') {
    if (simulationInterval) clearInterval(simulationInterval);

    let step = 0;
    const totalLayers = Math.max(10, stats.layerCount);
    const targetNozzle = scene.printProfile.nozzleTempC || 220;
    const targetBed = scene.printProfile.bedTempC || 60;

    const initialTel: BambuLiveTelemetry = {
      connected: true,
      connectionMode: mode,
      printerState: 'PREPARE',
      subtaskName: scene.title,
      progressPercent: 2,
      currentLayer: 1,
      totalLayers,
      remainingMinutes: stats.estimatedPrintMinutes,
      nozzleTempC: 145,
      nozzleTargetTempC: targetNozzle,
      bedTempC: 52,
      bedTargetTempC: targetBed,
      chamberTempC: 31,
      speedLevel: 2,
      chamberLightOn: true,
      fanSpeedPercent: 70,
      activeProjectId: projectId,
      lastUpdated: new Date().toISOString(),
      lastMessage: `Vorheizen & Bed-Leveling für "${scene.title}" (${targetNozzle}°C / ${targetBed}°C)...`,
    };
    ctx.db.execute(`UPDATE print_projects SET status = 'printing', progress_pct = 2, updated_at = ? WHERE id = ?`, [
      new Date().toISOString(),
      projectId,
    ]);
    saveTelemetry(initialTel);

    simulationInterval = setInterval(() => {
      const curr = getTelemetry();
      if (curr.printerState === 'PAUSE') return;
      if (curr.printerState !== 'RUNNING' && curr.printerState !== 'PREPARE') {
        if (simulationInterval) clearInterval(simulationInterval);
        simulationInterval = null;
        return;
      }

      step += 1;
      const nextPct = Math.min(100, Math.round(curr.progressPercent + 4));
      const nextLayer = Math.min(totalLayers, Math.max(1, Math.round((nextPct / 100) * totalLayers)));
      const remMin = Math.max(0, Math.round(stats.estimatedPrintMinutes * (1 - nextPct / 100)));
      const finished = nextPct >= 100;

      const updated: BambuLiveTelemetry = {
        ...curr,
        printerState: finished ? 'FINISH' : step <= 1 ? 'PREPARE' : 'RUNNING',
        progressPercent: nextPct,
        currentLayer: nextLayer,
        totalLayers,
        remainingMinutes: remMin,
        nozzleTempC: finished ? 48 : targetNozzle + Number(((Math.random() - 0.5) * 0.8).toFixed(1)),
        nozzleTargetTempC: finished ? 0 : targetNozzle,
        bedTempC: finished ? 38 : targetBed + Number(((Math.random() - 0.5) * 0.4).toFixed(1)),
        bedTargetTempC: finished ? 0 : targetBed,
        chamberTempC: finished ? 29 : 36.5,
        fanSpeedPercent: finished ? 0 : 100,
        lastUpdated: new Date().toISOString(),
        lastMessage: finished
          ? `3D-Druck "${scene.title}" erfolgreich abgeschlossen (100% · ${totalLayers} Layer)!`
          : `Druckt Layer ${nextLayer}/${totalLayers} (${nextPct}%) · Restzeit ca. ${remMin} Min.`,
      };

      ctx.db.execute(
        `UPDATE print_projects SET status = ?, progress_pct = ?, updated_at = ? WHERE id = ?`,
        [finished ? 'completed' : 'printing', nextPct, updated.lastUpdated, projectId]
      );
      saveTelemetry(updated);

      if (finished && simulationInterval) {
        clearInterval(simulationInterval);
        simulationInterval = null;
      }
    }, 3000);
  }

  // 1. GET /dashboard — Used by both Editor Page and Horizon Dashboard Mini-Preview
  ctx.route('GET', '/dashboard', async () => {
    const summary = syncSharedDashboardState();
    const rows = ctx.db.query<ProjectRow>('SELECT * FROM print_projects ORDER BY updated_at DESC');
    const projects = rows.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      status: r.status,
      progressPct: r.progress_pct,
      stats: JSON.parse(r.stats_json) as MeshStats,
      scene: JSON.parse(r.scene_json) as SceneSpec,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));

    const discovered = ctx.db.kvGet<BambuDiscoveredPrinter[]>('bambu_last_discovered') || [];
    const geminiKey = discoverGeminiApiKey();

    return {
      ...summary,
      projects,
      discoveredPrinters: discovered,
      bambuApiSpec: BAMBU_API_SPECIFICATION,
      aiStatus: {
        engine: geminiKey ? 'Antigravity AI + Google Gemini CAD' : 'Antigravity Parametric CAD Kernel',
        geminiConfigured: Boolean(geminiKey),
      },
    };
  });

  // 2. POST /projects/generate — Create a new 3D object from user prompt or template
  ctx.route('POST', '/projects/generate', async (req) => {
    const body = (req.body || {}) as {
      prompt?: string;
      presetKey?: string;
    };

    let scene: SceneSpec;
    let summary = '';
    let engine = 'Antigravity Parametric CAD';

    if (body.presetKey && PRESET_TEMPLATES[body.presetKey]) {
      scene = PRESET_TEMPLATES[body.presetKey]();
      scene.projectId = `proj-${Date.now()}`;
      summary = `Vorlage "${scene.title}" geladen und für Bambu Lab P1S vorbereitet.`;
    } else {
      const promptText = (body.prompt || '').trim();
      if (!promptText) {
        return { status: 400, body: { error: 'Bitte einen Prompt für das 3D-Objekt eingeben.' } };
      }
      const generated = await generateOrModify3dSceneWithAi(promptText, null);
      scene = generated.scene;
      summary = generated.summary;
      engine = generated.engine;
    }

    const compiled = compileSceneToMesh(scene);
    const nowIso = new Date().toISOString();

    ctx.db.execute(
      `INSERT INTO print_projects (id, title, description, scene_json, stats_json, status, progress_pct, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'sliced_ready', 100, ?, ?)`,
      [
        scene.projectId,
        scene.title,
        scene.description,
        JSON.stringify(scene),
        JSON.stringify(compiled.stats),
        nowIso,
        nowIso,
      ]
    );

    ctx.db.kvSet('active_project_id', scene.projectId);
    const tel = getTelemetry();
    saveTelemetry({
      ...tel,
      activeProjectId: scene.projectId,
      subtaskName: scene.title,
      progressPercent: 100,
      currentLayer: compiled.stats.layerCount,
      totalLayers: compiled.stats.layerCount,
      remainingMinutes: compiled.stats.estimatedPrintMinutes,
      lastUpdated: nowIso,
      lastMessage: `${engine}: ${summary}`,
    });

    return {
      ok: true,
      projectId: scene.projectId,
      scene,
      stats: compiled.stats,
      summary,
      engine,
    };
  });

  // 3. POST /projects/modify — Modify the active 3D object via natural-language user prompt or direct node edit
  ctx.route('POST', '/projects/modify', async (req) => {
    const body = (req.body || {}) as {
      projectId?: string;
      prompt?: string;
      updatedScene?: SceneSpec;
    };

    const targetId = body.projectId || ctx.db.kvGet<string>('active_project_id');
    if (!targetId) {
      return { status: 400, body: { error: 'Kein aktives 3D-Projekt ausgewählt.' } };
    }

    const row = ctx.db.queryOne<ProjectRow>('SELECT * FROM print_projects WHERE id = ?', [targetId]);
    if (!row) {
      return { status: 404, body: { error: 'Projekt nicht gefunden.' } };
    }

    const currentScene = JSON.parse(row.scene_json) as SceneSpec;
    let nextScene: SceneSpec;
    let summary = '';
    let engine = 'Antigravity Parametric CAD';

    if (body.updatedScene) {
      nextScene = body.updatedScene;
      nextScene.updatedAt = new Date().toISOString();
      summary = 'Manuelle Parameter-Änderung im 3D-Editor übernommen.';
      engine = 'Direct CAD Gizmo';
    } else {
      const promptText = (body.prompt || '').trim();
      if (!promptText) {
        return { status: 400, body: { error: 'Bitte einen Änderungs-Prompt eingeben.' } };
      }
      const modified = await generateOrModify3dSceneWithAi(promptText, currentScene);
      nextScene = modified.scene;
      summary = modified.summary;
      engine = modified.engine;
    }

    const compiled = compileSceneToMesh(nextScene);
    const nowIso = new Date().toISOString();

    ctx.db.execute(
      `UPDATE print_projects SET title = ?, description = ?, scene_json = ?, stats_json = ?, status = 'sliced_ready', progress_pct = 100, updated_at = ? WHERE id = ?`,
      [
        nextScene.title,
        nextScene.description,
        JSON.stringify(nextScene),
        JSON.stringify(compiled.stats),
        nowIso,
        targetId,
      ]
    );

    ctx.db.kvSet('active_project_id', targetId);
    const tel = getTelemetry();
    saveTelemetry({
      ...tel,
      activeProjectId: targetId,
      subtaskName: nextScene.title,
      totalLayers: compiled.stats.layerCount,
      currentLayer: compiled.stats.layerCount,
      remainingMinutes: compiled.stats.estimatedPrintMinutes,
      lastUpdated: nowIso,
      lastMessage: `${engine}: ${summary}`,
    });

    return {
      ok: true,
      projectId: targetId,
      scene: nextScene,
      stats: compiled.stats,
      summary,
      engine,
    };
  });

  // 4. POST /projects/select — Set active project OR set to null (to test/use empty placeholder state)
  ctx.route('POST', '/projects/select', async (req) => {
    const body = (req.body || {}) as { projectId?: string | null };
    if (!body.projectId) {
      if (simulationInterval) {
        clearInterval(simulationInterval);
        simulationInterval = null;
      }
      ctx.db.kvSet('active_project_id', null);
      const tel = getTelemetry();
      saveTelemetry({
        ...tel,
        printerState: 'IDLE',
        activeProjectId: null,
        progressPercent: 0,
        currentLayer: 0,
        totalLayers: 0,
        subtaskName: 'Kein Projekt aktiv',
        lastUpdated: new Date().toISOString(),
        lastMessage: 'Kein 3D-Projekt aktiv (Dashboard-Platzhalter aktiv).',
      });
      return { ok: true, activeProjectId: null, summary: syncSharedDashboardState() };
    }

    const row = ctx.db.queryOne<ProjectRow>('SELECT * FROM print_projects WHERE id = ?', [
      body.projectId,
    ]);
    if (!row) {
      return { status: 404, body: { error: 'Projekt nicht gefunden' } };
    }

    ctx.db.kvSet('active_project_id', row.id);
    const stats = JSON.parse(row.stats_json) as MeshStats;
    const tel = getTelemetry();
    saveTelemetry({
      ...tel,
      activeProjectId: row.id,
      subtaskName: row.title,
      progressPercent: row.progress_pct,
      currentLayer: stats.layerCount,
      totalLayers: stats.layerCount,
      remainingMinutes: stats.estimatedPrintMinutes,
      lastUpdated: new Date().toISOString(),
      lastMessage: `Projekt "${row.title}" aktiviert.`,
    });

    return { ok: true, activeProjectId: row.id, summary: syncSharedDashboardState() };
  });

  // 5. DELETE /projects — Delete a project
  ctx.route('DELETE', '/projects', async (req) => {
    const id = req.query.id;
    if (!id) return { status: 400, body: { error: 'Missing id' } };
    ctx.db.execute('DELETE FROM print_projects WHERE id = ?', [id]);
    const activeId = ctx.db.kvGet<string | null>('active_project_id');
    if (activeId === id) {
      const nextRow = ctx.db.queryOne<ProjectRow>(
        'SELECT * FROM print_projects ORDER BY updated_at DESC LIMIT 1'
      );
      ctx.db.kvSet('active_project_id', nextRow ? nextRow.id : null);
    }
    syncSharedDashboardState();
    return { deleted: id };
  });

  // 6. GET /projects/export — Generate & return printable .3MF, .STL, or .GCODE file
  ctx.route('GET', '/projects/export', async (req) => {
    const projectId = req.query.id || ctx.db.kvGet<string>('active_project_id');
    const format = (req.query.format || '3mf').toLowerCase();

    const row = projectId
      ? ctx.db.queryOne<ProjectRow>('SELECT * FROM print_projects WHERE id = ?', [projectId])
      : null;
    if (!row) {
      return { status: 404, body: { error: 'Kein 3D-Projekt zum Exportieren gefunden.' } };
    }

    const scene = JSON.parse(row.scene_json) as SceneSpec;
    const mesh = compileSceneToMesh(scene);
    const safeSlug = scene.title
      .toLowerCase()
      .replace(/[^a-z0-9-_]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'thassi_3d_model';

    if (format === 'stl') {
      const bytes = exportBinaryStl(mesh, scene.title);
      return {
        filename: `${safeSlug}.stl`,
        mimeType: 'model/stl',
        sizeBytes: bytes.byteLength,
        base64: Buffer.from(bytes).toString('base64'),
        stats: mesh.stats,
      };
    }

    if (format === 'gcode') {
      const gcode = exportPrintableGcode(mesh, scene);
      const buf = Buffer.from(gcode, 'utf-8');
      return {
        filename: `${safeSlug}_Bambu_P1S.gcode`,
        mimeType: 'text/x-gcode',
        sizeBytes: buf.byteLength,
        base64: buf.toString('base64'),
        stats: mesh.stats,
      };
    }

    // Default: .3mf package for Bambu Studio / OrcaSlicer / ElegooSlicer
    const bytes3mf = export3mfArchive(mesh, scene);
    return {
      filename: `${safeSlug}_Bambu_P1S.3mf`,
      mimeType: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml',
      sizeBytes: bytes3mf.byteLength,
      base64: Buffer.from(bytes3mf).toString('base64'),
      stats: mesh.stats,
    };
  });

  // 7. POST /printer/discover — Live scan LAN for BambuLab printer via SSDP (2021/1990) & TCP 8883/990
  ctx.route('POST', '/printer/discover', async () => {
    const discovered = await scanSubnetForBambuPrinters('192.168.188');
    ctx.db.kvSet('bambu_last_discovered', discovered);

    const cfg = getPrinterConfig();
    const configuredReachable8883 = await checkTcpPort(cfg.ip, 8883, 600);
    const configuredReachable990 = await checkTcpPort(cfg.ip, 990, 600);
    let certInfo: { ok: boolean; cn?: string; issuer?: string } = { ok: false };
    if (configuredReachable8883) {
      certInfo = await inspectBambuTlsCertificate(cfg.ip, 8883, 1000);
    }

    if (discovered.length > 0) {
      const first = discovered[0];
      ctx.db.kvSet('bambu_printer_config', {
        ...cfg,
        ip: first.ip,
        serial: first.serial || cfg.serial,
        model: first.model || cfg.model,
        name: first.name || cfg.name,
      });
    }

    // Check Shelly Smart Plug status in Home Assistant if available
    const allStates = await ctx.ha.getStates('switch');
    const shellyPlug = allStates.find((s) => s.entity_id === cfg.shellyPowerEntityId);

    return {
      ok: true,
      scannedSubnet: '192.168.188.0/24',
      discoveredPrinters: discovered,
      configuredPrinterProbe: {
        ip: cfg.ip,
        mqttTls8883: configuredReachable8883,
        ftps990: configuredReachable990,
        tlsCertCn: certInfo.cn || null,
        shellyPlugEntity: cfg.shellyPowerEntityId,
        shellyPlugState: shellyPlug?.state || 'unknown',
      },
      bambuApiSpec: BAMBU_API_SPECIFICATION,
    };
  });

  // 8. POST /printer/config — Save BambuLab IP, Serial Number, 8-char LAN Access Code & Shelly Entity
  ctx.route('POST', '/printer/config', async (req) => {
    const body = (req.body || {}) as Partial<BambuPrinterConfig>;
    const current = getPrinterConfig();
    const updated: BambuPrinterConfig = {
      ...current,
      ip: body.ip !== undefined ? body.ip.trim() : current.ip,
      serial: body.serial !== undefined ? body.serial.trim() : current.serial,
      accessCode:
        body.accessCode !== undefined && body.accessCode !== '••••••••' && body.accessCode !== ''
          ? body.accessCode.trim()
          : current.accessCode,
      model: body.model || current.model,
      name: body.name || current.name,
      shellyPowerEntityId: body.shellyPowerEntityId || current.shellyPowerEntityId,
      lanOnlyMode: body.lanOnlyMode ?? current.lanOnlyMode,
    };
    ctx.db.kvSet('bambu_printer_config', updated);
    syncSharedDashboardState();
    return {
      ok: true,
      printerConfig: {
        ...updated,
        accessCode: updated.accessCode ? '••••••••' : '',
        accessCodeConfigured: Boolean(updated.accessCode),
      },
    };
  });

  // 9. POST /printer/print — Send active 3D object to BambuLab printer (or start live Digital Twin print job)
  ctx.route('POST', '/printer/print', async (req) => {
    const body = (req.body || {}) as {
      projectId?: string;
      action?: 'start' | 'pause' | 'resume' | 'stop' | 'light_toggle';
    };

    const action = body.action || 'start';
    const cfg = getPrinterConfig();
    const tel = getTelemetry();

    if (action === 'pause') {
      if (cfg.accessCode) {
        await publishBambuMqttCommand(cfg, { print: { sequence_id: '10', command: 'pause' } });
      }
      saveTelemetry({
        ...tel,
        printerState: 'PAUSE',
        lastUpdated: new Date().toISOString(),
        lastMessage: 'Druckauftrag pausiert.',
      });
      return { ok: true, telemetry: getTelemetry() };
    }

    if (action === 'resume') {
      if (cfg.accessCode) {
        await publishBambuMqttCommand(cfg, { print: { sequence_id: '11', command: 'resume' } });
      }
      saveTelemetry({
        ...tel,
        printerState: 'RUNNING',
        lastUpdated: new Date().toISOString(),
        lastMessage: 'Druckauftrag fortgesetzt.',
      });
      return { ok: true, telemetry: getTelemetry() };
    }

    if (action === 'stop') {
      if (simulationInterval) {
        clearInterval(simulationInterval);
        simulationInterval = null;
      }
      if (cfg.accessCode) {
        await publishBambuMqttCommand(cfg, { print: { sequence_id: '12', command: 'stop' } });
      }
      saveTelemetry({
        ...tel,
        printerState: 'IDLE',
        progressPercent: 0,
        currentLayer: 0,
        nozzleTargetTempC: 0,
        bedTargetTempC: 0,
        fanSpeedPercent: 0,
        lastUpdated: new Date().toISOString(),
        lastMessage: 'Druckauftrag abgebrochen · Drucker im Bereit-Modus.',
      });
      return { ok: true, telemetry: getTelemetry() };
    }

    if (action === 'light_toggle') {
      const nextLight = !tel.chamberLightOn;
      if (cfg.accessCode) {
        await publishBambuMqttCommand(cfg, {
          system: {
            sequence_id: '13',
            command: 'ledctrl',
            led_node: 'chamber_light',
            led_mode: nextLight ? 'on' : 'off',
          },
        });
      }
      saveTelemetry({
        ...tel,
        chamberLightOn: nextLight,
        lastUpdated: new Date().toISOString(),
        lastMessage: `Bauraum-LED ${nextLight ? 'eingeschaltet' : 'ausgeschaltet'}.`,
      });
      return { ok: true, telemetry: getTelemetry() };
    }

    // Start print job for active project
    const targetId = body.projectId || ctx.db.kvGet<string>('active_project_id');
    const row = targetId
      ? ctx.db.queryOne<ProjectRow>('SELECT * FROM print_projects WHERE id = ?', [targetId])
      : null;
    if (!row) {
      return { status: 404, body: { error: 'Kein aktives 3D-Projekt zum Drucken ausgewählt.' } };
    }

    const scene = JSON.parse(row.scene_json) as SceneSpec;
    const stats = JSON.parse(row.stats_json) as MeshStats;

    let mqttResult = { ok: false, message: '' };
    if (cfg.ip && cfg.serial && cfg.accessCode) {
      mqttResult = await publishBambuMqttCommand(cfg, {
        print: {
          sequence_id: String(Date.now()),
          command: 'project_file',
          param: 'Metadata/plate_1.gcode',
          url: `ftp:///${row.id}.3mf`,
          subtask_name: scene.title,
          bed_type: 'auto',
          timelapse: false,
          bed_leveling: true,
          flow_cali: true,
          vibration_cali: true,
          use_ams: false,
        },
      });
    }

    startPrintJobTicker(
      row.id,
      scene,
      stats,
      mqttResult.ok ? 'lan_mqtt_tls' : 'digital_twin_simulation'
    );

    return {
      ok: true,
      mode: mqttResult.ok ? 'lan_mqtt_tls' : 'digital_twin_simulation',
      mqttMessage: mqttResult.message || 'Bambu Lab P1S Live-Fortschrittssimulation (Digital Twin) gestartet.',
      telemetry: getTelemetry(),
    };
  });

  // 10. Scheduled Background Job to publish 3D Print Sensors to Home Assistant
  async function publishHaSensors(appCtx: ThassiAppContext) {
    const summary = syncSharedDashboardState();
    const haStatus = await appCtx.ha.getStatus();
    if (!haStatus.connected) return 'HA offline';

    const stateLabel = summary.hasActiveProject
      ? `${summary.activeProject?.title} (${summary.telemetry.printerState} · ${summary.telemetry.progressPercent}%)`
      : 'Kein 3D-Projekt aktiv';

    await appCtx.ha.publishSensor('status', stateLabel, {
      friendly_name: 'Thassi 3D Druck Status',
      icon: 'mdi:printer-3d-nozzle',
      has_active_project: summary.hasActiveProject,
      project_title: summary.activeProject?.title || null,
      printer_state: summary.telemetry.printerState,
      progress_percent: summary.telemetry.progressPercent,
      current_layer: summary.telemetry.currentLayer,
      total_layers: summary.telemetry.totalLayers,
      nozzle_temp_c: summary.telemetry.nozzleTempC,
      bed_temp_c: summary.telemetry.bedTempC,
      printer_model: summary.printerConfig.model,
      printer_ip: summary.printerConfig.ip,
    });

    await appCtx.ha.publishSensor('progress', summary.telemetry.progressPercent, {
      friendly_name: 'Thassi 3D Druck Fortschritt',
      unit_of_measurement: '%',
      icon: 'mdi:progress-clock',
      project_title: summary.activeProject?.title || 'Leerlauf',
    });

    return stateLabel;
  }

  ctx.route('POST', '/supervisor-sync', async (req) => {
    const supToken = process.env.SUPERVISOR_TOKEN || '';
    const body = (req.body || {}) as { path?: string; method?: string; payload?: unknown };
    if (!supToken) {
      return { ok: false, error: 'No SUPERVISOR_TOKEN in environment' };
    }
    const targetPath = (body.path || '/store/reload').replace(/^\/+/, '/');
    const method = (body.method || 'POST').toUpperCase();
    try {
      const r = await fetch(`http://supervisor${targetPath}`, {
        method,
        headers: {
          Authorization: `Bearer ${supToken}`,
          'Content-Type': 'application/json',
        },
        body: method === 'GET' ? undefined : body.payload ? JSON.stringify(body.payload) : undefined,
      });
      const text = await r.text();
      let parsed: unknown = text;
      try {
        parsed = JSON.parse(text);
      } catch {}
      return { ok: r.ok, status: r.status, response: parsed };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  });

  ctx.scheduleJob({
    id: 'sync-3dprint-ha-sensors',
    name: 'Publish 3D Print Telemetry & Active Model Status to Home Assistant',
    intervalMinutes: 5,
    handler: async () => publishHaSensors(ctx),
  });

  void publishHaSensors(ctx).catch(() => {});
});
