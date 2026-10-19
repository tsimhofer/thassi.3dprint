import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createAppClient } from '@thassi/sdk/client';
import {
  compileSceneToMesh,
  type CompiledMesh,
  type MeshStats,
  type PrimitiveNode,
  type SceneSpec,
  type Vec3,
} from '../../shared/mesh-engine.js';

const api = createAppClient('3d-print');

interface BambuLiveTelemetry {
  connected: boolean;
  connectionMode: 'lan_mqtt_tls' | 'digital_twin_simulation' | 'standby_offline';
  printerState: 'IDLE' | 'PREPARE' | 'RUNNING' | 'PAUSE' | 'FINISH' | 'FAILED' | 'OFFLINE';
  subtaskName: string;
  progressPercent: number;
  currentLayer: number;
  totalLayers: number;
  remainingMinutes: number;
  nozzleTempC: number;
  nozzleTargetTempC: number;
  bedTempC: number;
  bedTargetTempC: number;
  chamberTempC: number;
  speedLevel: 1 | 2 | 3 | 4;
  chamberLightOn: boolean;
  fanSpeedPercent: number;
  activeProjectId: string | null;
  lastUpdated: string;
  lastMessage: string;
}

interface PrinterConfig {
  ip: string;
  serial: string;
  accessCode: string;
  accessCodeConfigured?: boolean;
  model: string;
  name: string;
  nozzleDiameterMm: number;
  bedDimensionsMm: [number, number, number];
  shellyPowerEntityId: string;
  lanOnlyMode: boolean;
}

interface ProjectSummary {
  id: string;
  title: string;
  description: string;
  status: string;
  progressPct: number;
  stats: MeshStats;
  scene: SceneSpec;
  updatedAt: string;
}

interface DashboardPayload {
  hasActiveProject: boolean;
  activeProject: ProjectSummary | null;
  projects: ProjectSummary[];
  telemetry: BambuLiveTelemetry;
  printerConfig: PrinterConfig;
  discoveredPrinters: Array<{
    ip: string;
    serial: string;
    name: string;
    model: string;
    firmware: string;
    discoveryMethod: string;
  }>;
  bambuApiSpec: Record<string, unknown>;
  aiStatus: {
    engine: string;
    geminiConfigured: boolean;
  };
}

type ViewRenderMode = 'solid' | 'wireframe' | 'xray' | 'slicer';

function hexToRgb(hex: string): [number, number, number] {
  const clean = (hex || '#00AE42').replace('#', '');
  const num = parseInt(clean.length === 6 ? clean : '00AE42', 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function Interactive3dViewport({
  scene,
  renderMode,
  sliceRatio,
  autoRotate,
  cameraResetKey,
  cameraPreset,
}: {
  scene: SceneSpec | null;
  renderMode: ViewRenderMode;
  sliceRatio: number;
  autoRotate: boolean;
  cameraResetKey: number;
  cameraPreset: 'iso' | 'front' | 'top' | 'side';
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const camRef = useRef({
    yaw: 0.68,
    pitch: 0.52,
    zoom: 1.95,
    panX: 0,
    panY: 18,
    dragging: false,
    panDragging: false,
    lastX: 0,
    lastY: 0,
  });

  const meshRef = useRef<CompiledMesh | null>(null);

  useEffect(() => {
    if (scene) {
      meshRef.current = compileSceneToMesh(scene);
    } else {
      meshRef.current = null;
    }
  }, [scene]);

  useEffect(() => {
    if (cameraPreset === 'iso') {
      camRef.current.yaw = 0.68;
      camRef.current.pitch = 0.52;
      camRef.current.panX = 0;
      camRef.current.panY = 18;
    } else if (cameraPreset === 'front') {
      camRef.current.yaw = 0;
      camRef.current.pitch = 0.12;
      camRef.current.panX = 0;
      camRef.current.panY = 22;
    } else if (cameraPreset === 'top') {
      camRef.current.yaw = 0;
      camRef.current.pitch = 1.48;
      camRef.current.panX = 0;
      camRef.current.panY = 0;
    } else if (cameraPreset === 'side') {
      camRef.current.yaw = Math.PI / 2;
      camRef.current.pitch = 0.15;
      camRef.current.panX = 0;
      camRef.current.panY = 22;
    }
  }, [cameraPreset, cameraResetKey]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let animId = 0;

    const projectPoint = (
      p: Vec3,
      w: number,
      h: number
    ): { sx: number; sy: number; depth: number; visible: boolean } => {
      const { yaw, pitch, zoom, panX, panY } = camRef.current;
      // Convert Z-up (CAD) into camera coordinates
      const cy = Math.cos(yaw);
      const sy = Math.sin(yaw);
      const cp = Math.cos(pitch);
      const sp = Math.sin(pitch);

      // Center object vertically around Z=25mm
      const px = p.x;
      const py = p.y;
      const pz = p.z - 25;

      const rx = px * cy - py * sy;
      const ry = px * sy + py * cy;

      const camX = rx;
      const camY = pz * cp - ry * sp;
      const camZ = pz * sp + ry * cp + 290 / Math.max(0.3, zoom);

      if (camZ <= 15) {
        return { sx: 0, sy: 0, depth: camZ, visible: false };
      }
      const fov = Math.min(w, h) * 1.15;
      const sx = w / 2 + panX + (camX * fov) / camZ;
      const screenY = h / 2 + panY - (camY * fov) / camZ;
      return { sx, sy: screenY, depth: camZ, visible: true };
    };

    const drawFrame = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const w = Math.max(300, Math.floor(rect.width));
      const h = Math.max(240, Math.floor(rect.height));
      if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.save();
      ctx.scale(dpr, dpr);

      if (autoRotate && !camRef.current.dragging && !camRef.current.panDragging) {
        camRef.current.yaw += 0.0055;
      }

      // Studio radial background
      const bgGrad = ctx.createRadialGradient(w * 0.5, h * 0.45, 20, w * 0.5, h * 0.5, w * 0.75);
      bgGrad.addColorStop(0, '#0f172a');
      bgGrad.addColorStop(1, '#040711');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Draw Bambu Lab P1S 256x256mm Textured PEI Build Plate at Z=0
      const halfBed = 128;
      const bedCorners: Vec3[] = [
        { x: -halfBed, y: -halfBed, z: 0 },
        { x: halfBed, y: -halfBed, z: 0 },
        { x: halfBed, y: halfBed, z: 0 },
        { x: -halfBed, y: halfBed, z: 0 },
      ];
      const projCorners = bedCorners.map((c) => projectPoint(c, w, h));
      if (projCorners.every((c) => c.visible)) {
        ctx.beginPath();
        ctx.moveTo(projCorners[0].sx, projCorners[0].sy);
        for (let i = 1; i < 4; i++) ctx.lineTo(projCorners[i].sx, projCorners[i].sy);
        ctx.closePath();
        ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.42)';
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }

      // Grid lines every 32mm on the 256x256mm bed
      ctx.lineWidth = 0.75;
      for (let g = -128; g <= 128; g += 32) {
        const isCenter = g === 0;
        ctx.strokeStyle = isCenter ? 'rgba(56, 189, 248, 0.28)' : 'rgba(148, 163, 184, 0.12)';
        const p1 = projectPoint({ x: g, y: -128, z: 0 }, w, h);
        const p2 = projectPoint({ x: g, y: 128, z: 0 }, w, h);
        if (p1.visible && p2.visible) {
          ctx.beginPath();
          ctx.moveTo(p1.sx, p1.sy);
          ctx.lineTo(p2.sx, p2.sy);
          ctx.stroke();
        }
        const p3 = projectPoint({ x: -128, y: g, z: 0 }, w, h);
        const p4 = projectPoint({ x: 128, y: g, z: 0 }, w, h);
        if (p3.visible && p4.visible) {
          ctx.beginPath();
          ctx.moveTo(p3.sx, p3.sy);
          ctx.lineTo(p4.sx, p4.sy);
          ctx.stroke();
        }
      }

      // Coordinate Axes at Origin (0,0,0)
      const o = projectPoint({ x: 0, y: 0, z: 0.2 }, w, h);
      const axX = projectPoint({ x: 45, y: 0, z: 0.2 }, w, h);
      const axY = projectPoint({ x: 0, y: 45, z: 0.2 }, w, h);
      const axZ = projectPoint({ x: 0, y: 0, z: 45 }, w, h);
      if (o.visible) {
        const drawAxis = (pt: typeof o, col: string, lbl: string) => {
          if (!pt.visible) return;
          ctx.strokeStyle = col;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(o.sx, o.sy);
          ctx.lineTo(pt.sx, pt.sy);
          ctx.stroke();
          ctx.fillStyle = col;
          ctx.font = '600 10px Inter, sans-serif';
          ctx.fillText(lbl, pt.sx + 4, pt.sy + 3);
        };
        drawAxis(axX, '#ef4444', 'X');
        drawAxis(axY, '#22c55e', 'Y');
        drawAxis(axZ, '#38bdf8', 'Z');
      }

      const mesh = meshRef.current;
      if (!mesh || mesh.triangles.length === 0) {
        // Placeholder wireframe cube when no 3D project is active
        const s = 26;
        const cubePts: Vec3[] = [
          { x: -s, y: -s, z: 0 },
          { x: s, y: -s, z: 0 },
          { x: s, y: s, z: 0 },
          { x: -s, y: s, z: 0 },
          { x: -s, y: -s, z: s * 2 },
          { x: s, y: -s, z: s * 2 },
          { x: s, y: s, z: s * 2 },
          { x: -s, y: s, z: s * 2 },
        ];
        const edges = [
          [0, 1], [1, 2], [2, 3], [3, 0],
          [4, 5], [5, 6], [6, 7], [7, 4],
          [0, 4], [1, 5], [2, 6], [3, 7],
        ];
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 1.5;
        for (const [i0, i1] of edges) {
          const p0 = projectPoint(cubePts[i0], w, h);
          const p1 = projectPoint(cubePts[i1], w, h);
          if (p0.visible && p1.visible) {
            ctx.beginPath();
            ctx.moveTo(p0.sx, p0.sy);
            ctx.lineTo(p1.sx, p1.sy);
            ctx.stroke();
          }
        }
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(248, 250, 252, 0.55)';
        ctx.font = '500 13px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Kein 3D-Projekt aktiv — Prompt eingeben oder Vorlage wählen', w / 2, h - 24);
        ctx.restore();
        animId = requestAnimationFrame(drawFrame);
        return;
      }

      const maxZClip =
        renderMode === 'slicer'
          ? mesh.stats.bounds.min.z +
            (mesh.stats.bounds.max.z - mesh.stats.bounds.min.z) * Math.max(0.02, sliceRatio)
          : Infinity;

      const lightDir = { x: 0.45, y: -0.58, z: 0.68 };
      const drawable: Array<{
        p0: { sx: number; sy: number };
        p1: { sx: number; sy: number };
        p2: { sx: number; sy: number };
        depth: number;
        fill: string;
        stroke: string;
        isCutPlane: boolean;
      }> = [];

      for (const tri of mesh.triangles) {
        const minTriZ = Math.min(tri.v0.z, tri.v1.z, tri.v2.z);
        if (minTriZ > maxZClip) continue;

        const p0 = projectPoint(tri.v0, w, h);
        const p1 = projectPoint(tri.v1, w, h);
        const p2 = projectPoint(tri.v2, w, h);
        if (!p0.visible || !p1.visible || !p2.visible) continue;

        const depth = (p0.depth + p1.depth + p2.depth) / 3;
        const dot =
          tri.normal.x * lightDir.x + tri.normal.y * lightDir.y + tri.normal.z * lightDir.z;
        const shade = Math.max(0.26, Math.min(1.12, 0.56 + dot * 0.46));
        const [r, g, b] = hexToRgb(tri.color);
        const rr = Math.min(255, Math.round(r * shade));
        const gg = Math.min(255, Math.round(g * shade));
        const bb = Math.min(255, Math.round(b * shade));

        const maxTriZ = Math.max(tri.v0.z, tri.v1.z, tri.v2.z);
        const isCutPlane = renderMode === 'slicer' && maxTriZ >= maxZClip - 1.2;

        const alpha =
          renderMode === 'xray'
            ? tri.isSubtract
              ? 0.65
              : 0.34
            : tri.isSubtract
              ? 0.55
              : 0.96;

        drawable.push({
          p0,
          p1,
          p2,
          depth,
          fill: isCutPlane
            ? 'rgba(251, 191, 36, 0.92)'
            : `rgba(${rr}, ${gg}, ${bb}, ${alpha})`,
          stroke:
            renderMode === 'wireframe'
              ? `rgba(56, 189, 248, 0.78)`
              : isCutPlane
                ? '#f59e0b'
                : `rgba(${Math.round(rr * 0.7)}, ${Math.round(gg * 0.7)}, ${Math.round(bb * 0.7)}, 0.35)`,
          isCutPlane,
        });
      }

      // Painter's algorithm sort (back to front)
      drawable.sort((a, b) => b.depth - a.depth);

      for (const d of drawable) {
        ctx.beginPath();
        ctx.moveTo(d.p0.sx, d.p0.sy);
        ctx.lineTo(d.p1.sx, d.p1.sy);
        ctx.lineTo(d.p2.sx, d.p2.sy);
        ctx.closePath();

        if (renderMode !== 'wireframe') {
          ctx.fillStyle = d.fill;
          ctx.fill();
        }
        ctx.strokeStyle = d.stroke;
        ctx.lineWidth = renderMode === 'wireframe' ? 0.9 : 0.45;
        ctx.stroke();
      }

      ctx.restore();
      animId = requestAnimationFrame(drawFrame);
    };

    animId = requestAnimationFrame(drawFrame);
    return () => cancelAnimationFrame(animId);
  }, [autoRotate, renderMode, sliceRatio]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        cursor: 'grab',
        touchAction: 'none',
      }}
      onContextMenu={(e) => e.preventDefault()}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        if (e.button === 2 || e.shiftKey) {
          camRef.current.panDragging = true;
        } else {
          camRef.current.dragging = true;
        }
        camRef.current.lastX = e.clientX;
        camRef.current.lastY = e.clientY;
      }}
      onPointerMove={(e) => {
        if (!camRef.current.dragging && !camRef.current.panDragging) return;
        const dx = e.clientX - camRef.current.lastX;
        const dy = e.clientY - camRef.current.lastY;
        camRef.current.lastX = e.clientX;
        camRef.current.lastY = e.clientY;

        if (camRef.current.panDragging) {
          camRef.current.panX += dx;
          camRef.current.panY += dy;
        } else {
          camRef.current.yaw += dx * 0.0085;
          camRef.current.pitch = Math.max(
            -0.35,
            Math.min(1.52, camRef.current.pitch + dy * 0.0075)
          );
        }
      }}
      onPointerUp={() => {
        camRef.current.dragging = false;
        camRef.current.panDragging = false;
      }}
      onWheel={(e) => {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.1 : 0.9;
        camRef.current.zoom = Math.max(0.55, Math.min(4.8, camRef.current.zoom * factor));
      }}
    />
  );
}

export function App() {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyMessage, setBusyMessage] = useState<string | null>(null);

  // Prompt state
  const [newPrompt, setNewPrompt] = useState('');
  const [modifyPrompt, setModifyPrompt] = useState('');

  // Viewport controls
  const [renderMode, setRenderMode] = useState<ViewRenderMode>('solid');
  const [sliceRatio, setSliceRatio] = useState<number>(1.0);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [cameraPreset, setCameraPreset] = useState<'iso' | 'front' | 'top' | 'side'>('iso');
  const [cameraResetKey, setCameraResetKey] = useState<number>(0);

  // Active tab in right panel: 'ai_editor' | 'nodes' | 'bambu_network'
  const [activeTab, setActiveTab] = useState<'ai_editor' | 'nodes' | 'bambu_network'>('ai_editor');

  // Printer config form
  const [printerIp, setPrinterIp] = useState('');
  const [printerSerial, setPrinterSerial] = useState('');
  const [printerAccessCode, setPrinterAccessCode] = useState('');
  const [printerModel, setPrinterModel] = useState('Bambu Lab P1S');
  const [discoverResult, setDiscoverResult] = useState<string | null>(null);

  const loadDashboard = async () => {
    try {
      const res = await api.get<DashboardPayload>('/dashboard');
      setData(res);
      if (!printerIp && res.printerConfig) {
        setPrinterIp(res.printerConfig.ip);
        setPrinterSerial(res.printerConfig.serial);
        setPrinterModel(res.printerConfig.model);
      }
    } catch (err) {
      console.error('Failed loading 3d-print dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
    const timer = setInterval(loadDashboard, 3000);
    return () => clearInterval(timer);
  }, []);

  const handleGenerateNew = async (e?: React.FormEvent, presetKey?: string) => {
    if (e) e.preventDefault();
    if (!presetKey && !newPrompt.trim()) return;
    setBusyMessage('Antigravity KI generiert 3D-Geometrie & druckbares Mesh…');
    try {
      await api.post('/projects/generate', {
        prompt: newPrompt.trim(),
        presetKey,
      });
      setNewPrompt('');
      await loadDashboard();
    } finally {
      setBusyMessage(null);
    }
  };

  const handleModifyScene = async (customPrompt?: string) => {
    const p = (customPrompt ?? modifyPrompt).trim();
    if (!p) return;
    setBusyMessage(`Wende KI-Änderung an: "${p}"…`);
    try {
      await api.post('/projects/modify', { prompt: p });
      if (!customPrompt) setModifyPrompt('');
      await loadDashboard();
    } finally {
      setBusyMessage(null);
    }
  };

  const handleDirectNodeUpdate = async (updatedNodes: PrimitiveNode[]) => {
    if (!data?.activeProject) return;
    const nextScene: SceneSpec = {
      ...data.activeProject.scene,
      nodes: updatedNodes,
    };
    await api.post('/projects/modify', {
      projectId: data.activeProject.id,
      updatedScene: nextScene,
    });
    await loadDashboard();
  };

  const handleExportFile = async (format: '3mf' | 'stl' | 'gcode') => {
    setBusyMessage(`Erzeuge druckbare .${format.toUpperCase()}-Datei…`);
    try {
      const res = await api.get<{
        filename: string;
        mimeType: string;
        base64: string;
        sizeBytes: number;
      }>(`/projects/export?format=${format}`);
      const binStr = atob(res.base64);
      const bytes = new Uint8Array(binStr.length);
      for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);
      const blob = new Blob([bytes], { type: res.mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setBusyMessage(null);
    }
  };

  const handlePrintAction = async (action: 'start' | 'pause' | 'resume' | 'stop' | 'light_toggle') => {
    setBusyMessage(
      action === 'start'
        ? 'Übertrage 3MF-Auftrag an BambuLab P1S…'
        : `Sende Drucker-Befehl (${action})…`
    );
    try {
      await api.post('/printer/print', { action });
      await loadDashboard();
    } finally {
      setBusyMessage(null);
    }
  };

  const handleDiscoverPrinter = async () => {
    setBusyMessage('Scanne Subnetz 192.168.188.0/24 (SSDP 2021/1990 & MQTT-TLS 8883)…');
    try {
      const res = await api.post<{
        discoveredPrinters: Array<{ ip: string; serial: string; model: string }>;
        configuredPrinterProbe: {
          ip: string;
          mqttTls8883: boolean;
          ftps990: boolean;
          shellyPlugEntity: string;
          shellyPlugState: string;
        };
      }>('/printer/discover', {});
      if (res.discoveredPrinters.length > 0) {
        const p = res.discoveredPrinters[0];
        setPrinterIp(p.ip);
        setPrinterSerial(p.serial);
        setDiscoverResult(
          `✅ BambuLab Drucker gefunden: ${p.model} unter ${p.ip} (SN: ${p.serial})`
        );
      } else {
        setDiscoverResult(
          `ℹ️ Scan abgeschlossen (192.168.188.0/24): Kein aktiver Port 8883/SSDP gefunden (Drucker im Standby/Aus · Shelly Plug ${res.configuredPrinterProbe.shellyPlugEntity}: ${res.configuredPrinterProbe.shellyPlugState}). Lokal erkanntes Slicer-Profil: Bambu Lab P1S (0.4mm Nozzle).`
        );
      }
      await loadDashboard();
    } finally {
      setBusyMessage(null);
    }
  };

  const handleSavePrinterConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusyMessage('Speichere BambuLab LAN-Konfiguration…');
    try {
      await api.post('/printer/config', {
        ip: printerIp,
        serial: printerSerial,
        accessCode: printerAccessCode,
        model: printerModel,
      });
      setPrinterAccessCode('');
      setDiscoverResult('✅ BambuLab LAN-Konfiguration gespeichert.');
      await loadDashboard();
    } finally {
      setBusyMessage(null);
    }
  };

  const activeProj = data?.activeProject || null;
  const tel = data?.telemetry;
  const stats = activeProj?.stats;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 430px',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        background: '#040711',
        color: '#f8fafc',
      }}
    >
      {/* LEFT REGION: INTERACTIVE 3D VIEWPORT + TOP/BOTTOM HUD */}
      <div style={{ position: 'relative', height: '100%', overflow: 'hidden' }}>
        <Interactive3dViewport
          scene={activeProj?.scene || null}
          renderMode={renderMode}
          sliceRatio={sliceRatio}
          autoRotate={autoRotate}
          cameraResetKey={cameraResetKey}
          cameraPreset={cameraPreset}
        />

        {/* TOP-LEFT HUD: ACTIVE PROJECT & BAMBULAB TELEMETRY */}
        <div
          style={{
            position: 'absolute',
            top: 18,
            left: 20,
            right: 20,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            pointerEvents: 'none',
            gap: 12,
          }}
        >
          <div
            style={{
              background: 'rgba(6, 10, 22, 0.78)',
              backdropFilter: 'blur(20px)',
              padding: '12px 18px',
              borderRadius: 16,
              border: '1px solid rgba(56, 189, 248, 0.18)',
              pointerEvents: 'auto',
              maxWidth: 460,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: activeProj ? '#00AE42' : '#fbbf24',
                  boxShadow: activeProj ? '0 0 10px #00AE42' : '0 0 10px #fbbf24',
                }}
              />
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: '#38bdf8',
                }}
              >
                thassi.3dprint · {data?.printerConfig?.model || 'Bambu Lab P1S'} (256×256×256mm)
              </span>
            </div>
            <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em' }}>
              {activeProj ? activeProj.title : 'Kein 3D-Projekt aktiv (Platzhalter)'}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(248,250,252,0.65)', marginTop: 2 }}>
              {activeProj
                ? `${stats?.dimensionsMm.x} × ${stats?.dimensionsMm.y} × ${stats?.dimensionsMm.z} mm · ${stats?.triangleCount} Tris · ${stats?.filamentWeightG} g ${activeProj.scene.printProfile.filamentType} · ~${stats?.estimatedPrintMinutes} Min.`
                : 'Wähle rechts ein Projekt oder generiere ein neues 3D-Objekt per KI-Prompt.'}
            </div>
          </div>

          {/* VIEWPORT CAMERA & MODE CONTROLS */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: 8,
              pointerEvents: 'auto',
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: 6,
                background: 'rgba(6, 10, 22, 0.78)',
                backdropFilter: 'blur(20px)',
                padding: 6,
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {(
                [
                  ['solid', 'Solid CAD'],
                  ['wireframe', 'Mesh / Gitter'],
                  ['xray', 'Röntgen'],
                  ['slicer', 'Schicht-Slicer'],
                ] as const
              ).map(([m, label]) => (
                <button
                  key={m}
                  onClick={() => setRenderMode(m)}
                  style={{
                    border: 'none',
                    borderRadius: 8,
                    padding: '6px 11px',
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: renderMode === m ? '#38bdf8' : 'transparent',
                    color: renderMode === m ? '#040711' : 'rgba(248,250,252,0.75)',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            <div
              style={{
                display: 'flex',
                gap: 6,
                background: 'rgba(6, 10, 22, 0.72)',
                backdropFilter: 'blur(16px)',
                padding: 5,
                borderRadius: 10,
              }}
            >
              {(
                [
                  ['iso', '3D Iso'],
                  ['front', 'Vorne'],
                  ['top', 'Oben'],
                  ['side', 'Seite'],
                ] as const
              ).map(([preset, lbl]) => (
                <button
                  key={preset}
                  onClick={() => {
                    setCameraPreset(preset);
                    setCameraResetKey((k) => k + 1);
                  }}
                  style={smallHudBtnStyle}
                >
                  {lbl}
                </button>
              ))}
              <button
                onClick={() => setAutoRotate((r) => !r)}
                style={{
                  ...smallHudBtnStyle,
                  color: autoRotate ? '#4ade80' : 'rgba(248,250,252,0.55)',
                }}
              >
                {autoRotate ? '⟳ Auto-Rot AN' : '⟳ Auto-Rot AUS'}
              </button>
            </div>
          </div>
        </div>

        {/* LAYER SLICER VERTICAL SLIDER WHEN IN SLICER MODE */}
        {renderMode === 'slicer' && activeProj && (
          <div
            style={{
              position: 'absolute',
              right: 22,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(6, 10, 22, 0.85)',
              backdropFilter: 'blur(20px)',
              padding: '14px 12px',
              borderRadius: 14,
              border: '1px solid rgba(251, 191, 36, 0.35)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span style={{ fontSize: 10, fontWeight: 700, color: '#fbbf24' }}>
              LAYER {Math.max(1, Math.round(sliceRatio * (stats?.layerCount || 1)))} /{' '}
              {stats?.layerCount || 1}
            </span>
            <input
              type="range"
              min={0.03}
              max={1}
              step={0.01}
              value={sliceRatio}
              onChange={(e) => setSliceRatio(Number(e.target.value))}
              style={{
                writingMode: 'vertical-lr',
                direction: 'rtl',
                height: 180,
                accentColor: '#fbbf24',
                cursor: 'pointer',
              }}
            />
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)' }}>
              {(sliceRatio * (stats?.dimensionsMm.z || 0)).toFixed(1)} mm
            </span>
          </div>
        )}

        {/* BOTTOM VIEWPORT BAR: LIVE PROMPT MODIFIER + PRINT PROGRESS + EXPORT */}
        <div
          style={{
            position: 'absolute',
            left: 20,
            right: 20,
            bottom: 18,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {busyMessage && (
            <div
              style={{
                alignSelf: 'flex-start',
                background: 'rgba(14, 116, 144, 0.9)',
                color: '#fff',
                padding: '7px 14px',
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              ⏳ {busyMessage}
            </div>
          )}

          {/* LIVE PROMPT MODIFIER BAR FOR ACTIVE 3D OBJECT */}
          {activeProj && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleModifyScene();
              }}
              style={{
                display: 'flex',
                gap: 8,
                background: 'rgba(6, 10, 22, 0.86)',
                backdropFilter: 'blur(24px)',
                padding: 10,
                borderRadius: 14,
                border: '1px solid rgba(56, 189, 248, 0.28)',
              }}
            >
              <input
                value={modifyPrompt}
                onChange={(e) => setModifyPrompt(e.target.value)}
                placeholder="Aktuelles 3D-Objekt per Prompt verändern (z.B. 'Mache es 25% höher', 'Bohrung Ø10mm in der Mitte', 'Farbe Rot', 'Füge Sockelplatte hinzu')…"
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10,
                  padding: '9px 14px',
                  color: '#fff',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                style={{
                  background: 'linear-gradient(135deg, #38bdf8, #0284c7)',
                  color: '#040711',
                  border: 'none',
                  borderRadius: 10,
                  padding: '0 18px',
                  fontWeight: 700,
                  fontSize: 12.5,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                ✨ Objekt per KI anpassen
              </button>
            </form>
          )}

          {/* PRINT PROGRESS & EXPORT BAR */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
              background: 'rgba(6, 10, 22, 0.86)',
              backdropFilter: 'blur(24px)',
              padding: '12px 16px',
              borderRadius: 16,
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {/* PROGRESS METER */}
            <div style={{ flex: 1, minWidth: 240 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 11.5,
                  marginBottom: 5,
                }}
              >
                <span style={{ fontWeight: 600, color: '#e2e8f0' }}>
                  {tel?.printerState === 'RUNNING' || tel?.printerState === 'PREPARE'
                    ? `🖨️ Druckt: ${tel.lastMessage}`
                    : tel?.lastMessage || 'Bereit zum Slicen & Drucken'}
                </span>
                <span style={{ fontWeight: 700, color: '#00AE42' }}>
                  {activeProj ? `${tel?.progressPercent ?? 100}%` : '0% (Leerlauf)'}
                </span>
              </div>
              <div
                style={{
                  height: 7,
                  borderRadius: 99,
                  background: 'rgba(255,255,255,0.09)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${activeProj ? (tel?.progressPercent ?? 100) : 0}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #00AE42, #38bdf8)',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: 14,
                  fontSize: 11,
                  color: 'rgba(248,250,252,0.55)',
                  marginTop: 5,
                }}
              >
                <span>🌡️ Düse: {tel?.nozzleTempC ?? 24}°C / {tel?.nozzleTargetTempC ?? 0}°C</span>
                <span>🔥 Heizbett: {tel?.bedTempC ?? 24}°C / {tel?.bedTargetTempC ?? 0}°C</span>
                <span>
                  📑 Layer: {tel?.currentLayer ?? 0} / {tel?.totalLayers ?? (stats?.layerCount || 0)}
                </span>
                <span style={{ color: 'rgba(248,250,252,0.4)' }}>
                  🖱️ Links ziehen: Drehen · Rechts/Shift: Verschieben · Mausrad: Zoom
                </span>
              </div>
            </div>

            {/* EXPORT & PRINT BUTTONS */}
            {activeProj && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={() => handleExportFile('3mf')}
                  style={exportBtnStyle}
                  title="Bambu Studio / OrcaSlicer / ElegooSlicer .3MF Projektdatei herunterladen"
                >
                  ⬇ .3MF (Bambu)
                </button>
                <button
                  onClick={() => handleExportFile('stl')}
                  style={exportBtnStyle}
                  title="Standard Binary .STL Mesh herunterladen"
                >
                  ⬇ .STL
                </button>
                <button
                  onClick={() => handleExportFile('gcode')}
                  style={exportBtnStyle}
                  title="Direkt druckbaren Bambu Lab P1S .GCODE herunterladen"
                >
                  ⬇ .GCODE
                </button>

                {tel?.printerState === 'RUNNING' || tel?.printerState === 'PREPARE' ? (
                  <>
                    <button
                      onClick={() => handlePrintAction('pause')}
                      style={{ ...primaryBtnStyle, background: '#fbbf24' }}
                    >
                      ⏸ Pause
                    </button>
                    <button
                      onClick={() => handlePrintAction('stop')}
                      style={{ ...primaryBtnStyle, background: '#ef4444', color: '#fff' }}
                    >
                      ⏹ Stop
                    </button>
                  </>
                ) : tel?.printerState === 'PAUSE' ? (
                  <>
                    <button
                      onClick={() => handlePrintAction('resume')}
                      style={{ ...primaryBtnStyle, background: '#00AE42', color: '#fff' }}
                    >
                      ▶ Fortsetzen
                    </button>
                    <button
                      onClick={() => handlePrintAction('stop')}
                      style={{ ...primaryBtnStyle, background: '#ef4444', color: '#fff' }}
                    >
                      ⏹ Stop
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handlePrintAction('start')}
                    style={{
                      ...primaryBtnStyle,
                      background: 'linear-gradient(135deg, #00AE42, #16a34a)',
                      color: '#fff',
                    }}
                  >
                    🖨️ An BambuLab senden / Druck starten
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT REGION: AI STUDIO, PARAMETRIC COMPONENT INSPECTOR & BAMBULAB NETWORK */}
      <div
        style={{
          height: '100vh',
          overflowY: 'auto',
          background: '#080d1a',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {/* TAB NAVIGATION */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 6,
            background: '#0f172a',
            padding: 5,
            borderRadius: 12,
          }}
        >
          {(
            [
              ['ai_editor', '✨ KI & Projekte'],
              ['nodes', '📐 CAD-Bauteile'],
              ['bambu_network', '📡 Bambu LAN'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={{
                border: 'none',
                borderRadius: 8,
                padding: '8px 6px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                background: activeTab === id ? '#38bdf8' : 'transparent',
                color: activeTab === id ? '#040711' : 'rgba(248,250,252,0.7)',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* TAB 1: AI GENERATOR, QUICK MODIFIERS & PROJECT LIST */}
        {activeTab === 'ai_editor' && (
          <>
            <div style={cardStyle}>
              <div style={sectionHeaderStyle}>
                <span>NEUES 3D-OBJEKT PER KI GENERIEREN</span>
                <span style={{ color: '#4ade80', fontSize: 10 }}>
                  {data?.aiStatus?.engine || 'Antigravity AI'}
                </span>
              </div>
              <form onSubmit={(e) => void handleGenerateNew(e)} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <textarea
                  rows={2}
                  value={newPrompt}
                  onChange={(e) => setNewPrompt(e.target.value)}
                  placeholder="Beschreibe das gewünschte 3D-Druckteil (z.B. 'Zahnrad mit 30 Zähnen und 8mm Bohrung', 'Spiral-Vase 110mm hoch', 'Schreibtisch-Organizer 3x2 Fächer')…"
                  style={inputStyle}
                />
                <button
                  type="submit"
                  style={{
                    ...primaryBtnStyle,
                    width: '100%',
                    background: 'linear-gradient(135deg, #38bdf8, #0284c7)',
                  }}
                >
                  🚀 Neues 3D-Objekt generieren & slicen
                </button>
              </form>

              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 10.5, color: 'rgba(248,250,252,0.5)', marginBottom: 6 }}>
                  Schnellstart-Vorlagen (Bambu Lab P1S optimiert):
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {[
                    ['desk_headphone_stand', '🎧 Kopfhörerhalter'],
                    ['precision_planetary_gear', '⚙️ Stirnrad Z24'],
                    ['twisted_rib_vase', '🏺 Spiral-Designvase'],
                    ['smart_home_organizer', '📦 6-Fach Organizer'],
                  ].map(([key, lbl]) => (
                    <button
                      key={key}
                      onClick={() => void handleGenerateNew(undefined, key)}
                      style={chipBtnStyle}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {activeProj && (
              <div style={cardStyle}>
                <div style={sectionHeaderStyle}>
                  <span>SCHNELL-MODIFIKATIONEN (AKTIVES OBJEKT)</span>
                  <span style={{ color: '#38bdf8' }}>{activeProj.scene.nodes.length} Nodes</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {[
                    'Mache das Objekt 25% höher',
                    'Vergrößere die Breite um 20%',
                    'Füge eine Bohrung mit 10mm Durchmesser in der Mitte hinzu',
                    'Füge unten eine verstärkte Sockelplatte hinzu',
                    'Füge oben einen Befestigungsring hinzu',
                    'Ändere die Farbe auf Bambu Grün #00AE42',
                    'Ändere die Farbe auf Cyber Blau #38bdf8',
                    'Ändere die Farbe auf Gold #fbbf24',
                  ].map((qPrompt) => (
                    <button
                      key={qPrompt}
                      onClick={() => void handleModifyScene(qPrompt)}
                      style={chipBtnStyle}
                    >
                      + {qPrompt}
                    </button>
                  ))}
                </div>

                {/* Prompt History */}
                {activeProj.scene.promptHistory?.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 10.5, color: 'rgba(248,250,252,0.45)', marginBottom: 6 }}>
                      KI-Prompt-Verlauf ({activeProj.scene.promptHistory.length}):
                    </div>
                    <div
                      style={{
                        maxHeight: 135,
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                      }}
                    >
                      {activeProj.scene.promptHistory.map((h) => (
                        <div
                          key={h.id}
                          style={{
                            background: 'rgba(255,255,255,0.035)',
                            padding: '7px 10px',
                            borderRadius: 8,
                            fontSize: 11.5,
                          }}
                        >
                          <div style={{ fontWeight: 600, color: '#e2e8f0' }}>“{h.prompt}”</div>
                          <div style={{ color: 'rgba(248,250,252,0.58)', fontSize: 11, marginTop: 2 }}>
                            {h.summary}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* PROJECT LIST & PLACEHOLDER TOGGLE */}
            <div style={cardStyle}>
              <div style={sectionHeaderStyle}>
                <span>3D-DRUCK PROJEKTE ({data?.projects?.length || 0})</span>
                <button
                  onClick={async () => {
                    await api.post('/projects/select', {
                      projectId: activeProj ? null : data?.projects?.[0]?.id || null,
                    });
                    await loadDashboard();
                  }}
                  style={{
                    border: '1px solid rgba(251, 191, 36, 0.4)',
                    background: !activeProj ? 'rgba(251, 191, 36, 0.2)' : 'transparent',
                    color: '#fbbf24',
                    borderRadius: 6,
                    padding: '3px 8px',
                    fontSize: 10.5,
                    cursor: 'pointer',
                  }}
                  title="Schaltet um zwischen aktivem 3D-Projekt und dem Leerlauf-Platzhalter auf dem HASS Dashboard"
                >
                  {activeProj ? '⏸ Projekt deaktivieren (Platzhalter)' : '▶ Projekt aktivieren'}
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(data?.projects || []).map((p) => {
                  const isSelected = activeProj?.id === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={async () => {
                        await api.post('/projects/select', { projectId: p.id });
                        await loadDashboard();
                      }}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 10,
                        background: isSelected ? 'rgba(56, 189, 248, 0.14)' : 'rgba(255,255,255,0.03)',
                        border: isSelected
                          ? '1px solid rgba(56, 189, 248, 0.45)'
                          : '1px solid rgba(255,255,255,0.06)',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>
                          {isSelected ? '● ' : ''}
                          {p.title}
                        </div>
                        <div style={{ fontSize: 11, color: 'rgba(248,250,252,0.55)', marginTop: 2 }}>
                          {p.stats.dimensionsMm.x}×{p.stats.dimensionsMm.y}×{p.stats.dimensionsMm.z}mm ·{' '}
                          {p.stats.filamentWeightG}g · {p.stats.layerCount} Layer
                        </div>
                      </div>
                      <button
                        onClick={async (ev) => {
                          ev.stopPropagation();
                          await api.delete(`/projects?id=${encodeURIComponent(p.id)}`);
                          await loadDashboard();
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'rgba(248, 113, 113, 0.7)',
                          cursor: 'pointer',
                          fontSize: 13,
                        }}
                        title="Projekt löschen"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* TAB 2: DIRECT PARAMETRIC CAD COMPONENT INSPECTOR */}
        {activeTab === 'nodes' && (
          <div style={cardStyle}>
            <div style={sectionHeaderStyle}>
              <span>PARAMETRISCHE CAD-KOMPONENTEN</span>
              <span style={{ color: '#38bdf8' }}>{activeProj?.scene.nodes.length || 0} Elemente</span>
            </div>
            {!activeProj ? (
              <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)' }}>
                Kein aktives 3D-Projekt ausgewählt.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {activeProj.scene.nodes.map((node, idx) => (
                  <div
                    key={node.id}
                    style={{
                      background: 'rgba(255,255,255,0.035)',
                      padding: 12,
                      borderRadius: 10,
                      border: '1px solid rgba(255,255,255,0.07)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 8,
                      }}
                    >
                      <strong style={{ fontSize: 12.5, color: '#fff' }}>
                        #{idx + 1} {node.name} ({node.type})
                      </strong>
                      <span
                        style={{
                          fontSize: 10,
                          padding: '2px 7px',
                          borderRadius: 99,
                          background:
                            node.operation === 'subtract'
                              ? 'rgba(244,63,94,0.2)'
                              : 'rgba(0,174,66,0.2)',
                          color: node.operation === 'subtract' ? '#fb7185' : '#4ade80',
                        }}
                      >
                        {node.operation === 'subtract' ? 'Abzug (Bohrung)' : 'Solid (Union)'}
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 8,
                        fontSize: 11.5,
                      }}
                    >
                      {Object.entries(node.params).map(([pKey, pVal]) => (
                        <label
                          key={pKey}
                          style={{ display: 'flex', flexDirection: 'column', gap: 3 }}
                        >
                          <span style={{ color: 'rgba(248,250,252,0.55)', fontSize: 10.5 }}>
                            {pKey}
                          </span>
                          <input
                            type="number"
                            step="any"
                            value={pVal}
                            onChange={(e) => {
                              const nextNodes = activeProj.scene.nodes.map((n, i) =>
                                i === idx
                                  ? {
                                      ...n,
                                      params: { ...n.params, [pKey]: Number(e.target.value) },
                                    }
                                  : n
                              );
                              void handleDirectNodeUpdate(nextNodes);
                            }}
                            style={{ ...inputStyle, padding: '5px 8px', marginBottom: 0 }}
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: BAMBULAB NETWORK DISCOVERY & DIRECT LAN API CONFIG */}
        {activeTab === 'bambu_network' && (
          <>
            <div style={cardStyle}>
              <div style={sectionHeaderStyle}>
                <span>1. BAMBULAB IM NETZWERK FINDEN</span>
                <span style={{ color: '#38bdf8' }}>192.168.188.0/24</span>
              </div>
              <p style={{ fontSize: 12, color: 'rgba(248,250,252,0.68)', margin: '0 0 10px' }}>
                Scannt das lokale Fritz!Box-Subnetz aktiv via <strong>SSDP Multicast (UDP 2021 / 1990)</strong>{' '}
                sowie <strong>MQTT-over-TLS (Port 8883)</strong> &amp; <strong>Implicit FTPS (Port 990)</strong>.
              </p>
              <button
                onClick={() => void handleDiscoverPrinter()}
                style={{
                  ...primaryBtnStyle,
                  width: '100%',
                  background: 'linear-gradient(135deg, #38bdf8, #0284c7)',
                }}
              >
                🔍 BambuLab Drucker im LAN jetzt suchen
              </button>
              {discoverResult && (
                <div
                  style={{
                    marginTop: 10,
                    padding: '9px 11px',
                    borderRadius: 9,
                    background: 'rgba(56, 189, 248, 0.1)',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    fontSize: 11.5,
                    lineHeight: 1.45,
                  }}
                >
                  {discoverResult}
                </div>
              )}
            </div>

            <div style={cardStyle}>
              <div style={sectionHeaderStyle}>
                <span>2. DIREKTE LAN-VERBINDUNG &amp; CREDENTIALS</span>
                <span style={{ color: data?.printerConfig?.accessCodeConfigured ? '#4ade80' : '#fbbf24' }}>
                  {data?.printerConfig?.accessCodeConfigured ? 'Access Code gesetzt' : 'Standby / Digital Twin'}
                </span>
              </div>
              <form onSubmit={handleSavePrinterConfig} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: 11, color: 'rgba(248,250,252,0.65)' }}>
                  Drucker-Modell (aus lokalem Slicer-Profil erkannt)
                  <input
                    value={printerModel}
                    onChange={(e) => setPrinterModel(e.target.value)}
                    style={{ ...inputStyle, marginTop: 4 }}
                  />
                </label>
                <label style={{ fontSize: 11, color: 'rgba(248,250,252,0.65)' }}>
                  Lokale IPv4-Adresse (Subnetz 192.168.188.x)
                  <input
                    value={printerIp}
                    onChange={(e) => setPrinterIp(e.target.value)}
                    placeholder="192.168.188.x"
                    style={{ ...inputStyle, marginTop: 4 }}
                  />
                </label>
                <label style={{ fontSize: 11, color: 'rgba(248,250,252,0.65)' }}>
                  Geräte-Seriennummer (USN, z.B. 01S00C... für P1S)
                  <input
                    value={printerSerial}
                    onChange={(e) => setPrinterSerial(e.target.value)}
                    placeholder="01S00C..."
                    style={{ ...inputStyle, marginTop: 4 }}
                  />
                </label>
                <label style={{ fontSize: 11, color: 'rgba(248,250,252,0.65)' }}>
                  8-stelliger LAN Access Code (Username ist fest: <code>bblp</code>)
                  <input
                    type="password"
                    value={printerAccessCode}
                    onChange={(e) => setPrinterAccessCode(e.target.value)}
                    placeholder={
                      data?.printerConfig?.accessCodeConfigured
                        ? '•••••••• (Gespeichert)'
                        : '8-stelliger Code vom Drucker-Display'
                    }
                    style={{ ...inputStyle, marginTop: 4 }}
                  />
                </label>
                <button
                  type="submit"
                  style={{
                    ...primaryBtnStyle,
                    background: '#00AE42',
                    color: '#fff',
                  }}
                >
                  💾 Verbindungsdaten speichern
                </button>
              </form>
            </div>

            <div style={cardStyle}>
              <div style={sectionHeaderStyle}>
                <span>3. PROTOKOLL- &amp; API-REFERENZ (DIREKTE KOMMUNIKATION)</span>
              </div>
              <div style={{ fontSize: 11.5, color: 'rgba(248,250,252,0.75)', lineHeight: 1.55 }}>
                <div>
                  <strong>• Discovery:</strong> UDP <code>239.255.255.250:2021</code> &amp;{' '}
                  <code>:1990</code> (<code>urn:bambulab-com:device:3dprinter:1</code>)
                </div>
                <div style={{ marginTop: 4 }}>
                  <strong>• MQTT over TLS:</strong> <code>mqtts://bblp:&lt;CODE&gt;@&lt;IP&gt;:8883</code>
                </div>
                <div style={{ marginTop: 4 }}>
                  <strong>• Telemetrie-Topic:</strong> <code>device/&lt;SERIAL&gt;/report</code>
                </div>
                <div style={{ marginTop: 4 }}>
                  <strong>• Steuer-Topic:</strong> <code>device/&lt;SERIAL&gt;/request</code>
                </div>
                <div style={{ marginTop: 4 }}>
                  <strong>• Datei-Upload (3MF/GCode):</strong>{' '}
                  <code>ftps://bblp:&lt;CODE&gt;@&lt;IP&gt;:990/</code> (Implicit TLS)
                </div>
                <div style={{ marginTop: 4 }}>
                  <strong>• Kamera-Stream:</strong> TCP <code>:6000</code> (P1S/P1P/A1) bzw. RTSPS{' '}
                  <code>:322</code> (X1C)
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: '#0f172a',
  borderRadius: 14,
  padding: 14,
  border: '1px solid rgba(255,255,255,0.07)',
};

const sectionHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: 10.5,
  fontWeight: 700,
  letterSpacing: '0.12em',
  color: 'rgba(248,250,252,0.55)',
  marginBottom: 10,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  background: '#060a15',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 9,
  padding: '8px 11px',
  color: '#f8fafc',
  fontSize: 12.5,
  outline: 'none',
  fontFamily: 'inherit',
};

const primaryBtnStyle: React.CSSProperties = {
  border: 'none',
  borderRadius: 9,
  padding: '9px 14px',
  fontSize: 12,
  fontWeight: 700,
  cursor: 'pointer',
  color: '#040711',
};

const exportBtnStyle: React.CSSProperties = {
  background: 'rgba(56, 189, 248, 0.14)',
  border: '1px solid rgba(56, 189, 248, 0.35)',
  color: '#38bdf8',
  borderRadius: 9,
  padding: '8px 12px',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
};

const chipBtnStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.055)',
  border: '1px solid rgba(255,255,255,0.09)',
  color: '#e2e8f0',
  borderRadius: 8,
  padding: '5px 9px',
  fontSize: 11,
  cursor: 'pointer',
  textAlign: 'left',
};

const smallHudBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'rgba(248,250,252,0.75)',
  padding: '4px 9px',
  borderRadius: 6,
  fontSize: 11,
  fontWeight: 600,
  cursor: 'pointer',
};

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
