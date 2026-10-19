import fs from 'node:fs';
import {
  DEFAULT_PRINT_PROFILE,
  PRESET_TEMPLATES,
  type PrimitiveNode,
  type PrimitiveType,
  type SceneSpec,
} from '../shared/mesh-engine.js';

export function discoverGeminiApiKey(): string {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY.trim();
  const storagePath = '/homeassistant/.storage/core.config_entries';
  try {
    if (fs.existsSync(storagePath)) {
      const raw = JSON.parse(fs.readFileSync(storagePath, 'utf-8'));
      const entries = raw?.data?.entries || [];
      for (let i = entries.length - 1; i >= 0; i--) {
        const e = entries[i];
        if (e.domain === 'google_generative_ai_conversation' && e.data?.api_key) {
          return String(e.data.api_key).trim();
        }
      }
    }
  } catch {
    // Ignore if not running inside HASS container
  }
  return '';
}

let cachedModel = '';

async function resolveGeminiModel(apiKey: string): Promise<string> {
  if (cachedModel) return cachedModel;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`,
      { signal: AbortSignal.timeout(4000) }
    );
    if (res.ok) {
      const data = (await res.json()) as {
        models?: Array<{ name: string; supportedGenerationMethods?: string[] }>;
      };
      const names = (data.models || [])
        .filter((m) => (m.supportedGenerationMethods || []).includes('generateContent'))
        .map((m) => m.name.replace(/^models\//, ''));
      for (const candidate of [
        'gemini-3.8-flash',
        'gemini-2.5-flash',
        'gemini-2.5-pro',
        'gemini-2.0-flash',
        'gemini-1.5-flash',
      ]) {
        if (names.includes(candidate)) {
          cachedModel = candidate;
          return candidate;
        }
      }
      const firstFlash = names.find(
        (n) => n.includes('flash') && !n.includes('tts') && !n.includes('image')
      );
      if (firstFlash) {
        cachedModel = firstFlash;
        return firstFlash;
      }
    }
  } catch {
    // Ignore
  }
  return 'gemini-2.0-flash';
}

const COLOR_MAP: Array<{ pattern: RegExp; hex: string; label: string }> = [
  { pattern: /\b(rot|red|crimson|rubin)\b/i, hex: '#ef4444', label: 'Rot' },
  { pattern: /\b(blau|blue|kobalt|navy|türkis|cyan)\b/i, hex: '#38bdf8', label: 'Blau / Cyan' },
  { pattern: /\b(grün|gruen|green|bambu|smaragd|lime)\b/i, hex: '#00AE42', label: 'Bambu Grün' },
  { pattern: /\b(gelb|yellow|gold|amber|messing)\b/i, hex: '#fbbf24', label: 'Gold / Gelb' },
  { pattern: /\b(orange|kupfer|copper|mandarin)\b/i, hex: '#f97316', label: 'Orange' },
  { pattern: /\b(lila|violett|purple|magenta)\b/i, hex: '#a855f7', label: 'Violett' },
  { pattern: /\b(weiss|weiß|white|klar|farblos)\b/i, hex: '#f8fafc', label: 'Weiß' },
  { pattern: /\b(schwarz|black|carbon|anthrazit|grau|grey|silber)\b/i, hex: '#64748b', label: 'Anthrazit / Carbon' },
];

function extractColorFromPrompt(prompt: string): { hex: string; label: string } | null {
  const hexMatch = prompt.match(/#([0-9a-fA-F]{6})\b/);
  if (hexMatch) {
    return { hex: `#${hexMatch[1]}`, label: `#${hexMatch[1]}` };
  }
  for (const c of COLOR_MAP) {
    if (c.pattern.test(prompt)) return c;
  }
  return null;
}

/**
 * Deterministic Antigravity Parametric CAD synthesizer & modifier.
 * Handles both initial 3D object creation from prompt and iterative modifications to an active SceneSpec.
 */
export function runLocalAntigravityCadEngine(
  prompt: string,
  existingScene?: SceneSpec | null
): { scene: SceneSpec; summary: string; engine: string } {
  const cleanPrompt = prompt.trim();
  const lower = cleanPrompt.toLowerCase();
  const nowIso = new Date().toISOString();
  const colorMatch = extractColorFromPrompt(cleanPrompt);

  // CASE A: If no existing scene OR prompt explicitly requests creating a brand-new archetype
  const isNewRequest =
    !existingScene ||
    /\b(neues objekt|erstelle neu|komplett neu|stattdessen)\b/i.test(lower);

  if (isNewRequest) {
    let baseScene: SceneSpec;
    let summary = '';

    if (/\b(zahnrad|gear|ritzel|zähne|zaehne|cog|getriebe)\b/i.test(lower)) {
      baseScene = PRESET_TEMPLATES.precision_planetary_gear();
      const teethMatch = lower.match(/(\d+)\s*(?:zähne|zaehne|teeth|t\b)/i);
      const boreMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*mm\s*(?:loch|bohrung|welle|bore)/i);
      const diaMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*mm\s*(?:durchmesser|diameter|groß|breit)/i);

      const gearNode = baseScene.nodes[0];
      if (teethMatch) {
        gearNode.params.teeth = Math.max(6, Math.min(72, Number(teethMatch[1])));
      }
      if (boreMatch) {
        const br = Math.max(1, Number(boreMatch[1].replace(',', '.')) / 2);
        gearNode.params.boreRadius = br;
        if (baseScene.nodes[1]) baseScene.nodes[1].params.innerRadius = br;
      }
      if (diaMatch) {
        gearNode.params.outerRadius = Math.max(10, Number(diaMatch[1].replace(',', '.')) / 2);
      }
      baseScene.title = `Stirnzahnrad Z${gearNode.params.teeth}`;
      summary = `Präzisions-Zahnrad mit ${gearNode.params.teeth} Zähnen (Ø${gearNode.params.outerRadius * 2}mm, Bohrung Ø${(gearNode.params.boreRadius || 5) * 2}mm) generiert.`;
    } else if (/\b(vase|becher|cup|blumentopf|topf|gefäß|gefaess|spiral|kelch|lampe)\b/i.test(lower)) {
      baseScene = PRESET_TEMPLATES.twisted_rib_vase();
      const heightMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*mm\s*(?:hoch|höhe|hoehe|high)/i);
      const ribMatch = lower.match(/(\d+)\s*(?:rippen|ribs|rillen)/i);
      const vaseNode = baseScene.nodes[0];
      if (heightMatch) vaseNode.params.height = Math.max(20, Math.min(240, Number(heightMatch[1].replace(',', '.'))));
      if (ribMatch) vaseNode.params.ribCount = Math.max(0, Math.min(36, Number(ribMatch[1])));
      baseScene.title = `Spiral-Designvase (${vaseNode.params.height}mm)`;
      summary = `Skulpturale Torsions-Vase (Höhe ${vaseNode.params.height}mm, ${vaseNode.params.ribCount} Rippen) erstellt.`;
    } else if (/\b(organizer|box|kasten|schublade|sortier|fach|fächer|faecher|tray|stiftehalter|halterung für kabel)\b/i.test(lower)) {
      baseScene = PRESET_TEMPLATES.smart_home_organizer();
      const orgNode = baseScene.nodes[0];
      const gridMatch = lower.match(/(\d+)\s*[x×]\s*(\d+)/);
      if (gridMatch) {
        orgNode.params.slotsX = Math.max(1, Math.min(5, Number(gridMatch[1])));
        orgNode.params.slotsY = Math.max(1, Math.min(4, Number(gridMatch[2])));
      }
      baseScene.title = `Modularer Organizer (${orgNode.params.slotsX}×${orgNode.params.slotsY} Fächer)`;
      summary = `Organizer-Box (${orgNode.params.width}×${orgNode.params.depth}×${orgNode.params.height}mm) mit ${orgNode.params.slotsX * orgNode.params.slotsY} Kammern generiert.`;
    } else if (/\b(kopfhörer|kopfhoerer|headphone|haken|hook|winkel|bracket|wandhalter|tischklemme|klemme|ständer|staender)\b/i.test(lower)) {
      baseScene = PRESET_TEMPLATES.desk_headphone_stand();
      baseScene.title = cleanPrompt.length <= 42 ? cleanPrompt : 'Tisch- & Wandhalterung (Bracket)';
      summary = `Verstärkte Halterung / Tischklemme (38×62×74mm) mit Kabeldurchführung für Bambu Lab P1S generiert.`;
    } else if (/\b(kugel|sphere|ball|kuppel|dome)\b/i.test(lower)) {
      const rMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*mm/);
      const rad = rMatch ? Math.max(8, Number(rMatch[1].replace(',', '.')) / 2) : 26;
      baseScene = {
        projectId: `proj-${Date.now()}`,
        title: `Geodätische Sphäre / Kuppel (Ø${rad * 2}mm)`,
        description: `Generiert aus Prompt: "${cleanPrompt}"`,
        createdAt: nowIso,
        updatedAt: nowIso,
        buildPlateMm: [256, 256, 256],
        printProfile: { ...DEFAULT_PRINT_PROFILE },
        nodes: [
          {
            id: 'node-sphere-1',
            name: 'Haupt-Kugelkörper',
            type: 'sphere',
            operation: 'union',
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
            color: colorMatch?.hex || '#00AE42',
            params: { radius: rad, domeOnly: /\b(kuppel|dome|halbkugel)\b/i.test(lower) ? 1 : 0 },
          },
          {
            id: 'node-stand-ring',
            name: 'Standring-Basis',
            type: 'cylinder',
            operation: 'union',
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
            color: colorMatch?.hex || '#00AE42',
            params: { radiusBottom: rad * 0.65, radiusTop: rad * 0.55, innerRadius: rad * 0.35, height: 6, segments: 36 },
          },
        ],
        promptHistory: [],
      };
      summary = `Sphären-Geometrie (Ø${rad * 2}mm) mit druckbarem Standring auf der Bauplatte erstellt.`;
    } else if (/\b(zylinder|rohr|tube|hülse|huelse|spacer|adapter|ring|spule)\b/i.test(lower)) {
      const nums = (lower.match(/\d+(?:[.,]\d+)?/g) || []).map((n) => Number(n.replace(',', '.')));
      const outerR = nums[0] ? Math.max(6, nums[0] / 2) : 25;
      const height = nums[1] ? Math.max(5, nums[1]) : 40;
      const innerR = nums[2] ? Math.min(outerR - 2, nums[2] / 2) : Math.max(0, outerR * 0.55);
      baseScene = {
        projectId: `proj-${Date.now()}`,
        title: `Zylinder-Hülse / Adapter (Ø${outerR * 2}×${height}mm)`,
        description: `Generiert aus Prompt: "${cleanPrompt}"`,
        createdAt: nowIso,
        updatedAt: nowIso,
        buildPlateMm: [256, 256, 256],
        printProfile: { ...DEFAULT_PRINT_PROFILE },
        nodes: [
          {
            id: 'node-cyl-main',
            name: 'Zylinderhülse',
            type: 'cylinder',
            operation: 'union',
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
            color: colorMatch?.hex || '#38bdf8',
            params: { radiusBottom: outerR, radiusTop: outerR, innerRadius: innerR, height, segments: 48 },
          },
        ],
        promptHistory: [],
      };
      summary = `Zylinder-Adapter (Außen-Ø${outerR * 2}mm, Innen-Ø${(innerR * 2).toFixed(1)}mm, Höhe ${height}mm) erstellt.`;
    } else {
      // General custom CAD housing / enclosure / object
      const dims = (lower.match(/(\d+(?:[.,]\d+)?)\s*mm/g) || []).map((s) =>
        Number(s.replace(/mm/i, '').replace(',', '.').trim())
      );
      const w = dims[0] || 64;
      const d = dims[1] || 48;
      const h = dims[2] || 32;
      baseScene = {
        projectId: `proj-${Date.now()}`,
        title: cleanPrompt.slice(0, 48) || 'Antigravity 3D-Objekt',
        description: `KI-generiertes 3D-Druckmodell für "${cleanPrompt}"`,
        createdAt: nowIso,
        updatedAt: nowIso,
        buildPlateMm: [256, 256, 256],
        printProfile: { ...DEFAULT_PRINT_PROFILE, filamentColor: colorMatch?.hex || '#00AE42' },
        nodes: [
          {
            id: 'node-base-chassis',
            name: 'Hauptkörper (Gefast)',
            type: 'box',
            operation: 'union',
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
            color: colorMatch?.hex || '#00AE42',
            params: { width: w, depth: d, height: h, bevel: 4, wallThickness: /\b(hohl|gehäuse|box|schale)\b/i.test(lower) ? 2.8 : 0 },
          },
          {
            id: 'node-top-boss',
            name: 'Zentraler Aufsatz / Flansch',
            type: 'cylinder',
            operation: 'union',
            position: [0, 0, h],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
            color: colorMatch?.hex || '#00AE42',
            params: { radiusBottom: Math.min(w, d) * 0.28, radiusTop: Math.min(w, d) * 0.24, innerRadius: Math.min(w, d) * 0.12, height: Math.max(8, h * 0.35), segments: 36 },
          },
        ],
        promptHistory: [],
      };
      summary = `Parametrisches 3D-Modell (${w}×${d}×${Math.round(h * 1.35)}mm) mit Flansch-Aufsatz für "${cleanPrompt}" generiert.`;
    }

    if (colorMatch) {
      baseScene.printProfile.filamentColor = colorMatch.hex;
      for (const n of baseScene.nodes) {
        if (n.operation !== 'subtract') n.color = colorMatch.hex;
      }
    }

    baseScene.projectId = `proj-${Date.now()}`;
    baseScene.updatedAt = nowIso;
    baseScene.promptHistory = [
      {
        id: `ph-${Date.now()}`,
        prompt: cleanPrompt,
        summary,
        engine: 'Antigravity Parametric CAD',
        timestamp: nowIso,
      },
    ];
    return { scene: baseScene, summary, engine: 'Antigravity Parametric CAD' };
  }

  // CASE B: Modify existing SceneSpec based on user prompt!
  const scene: SceneSpec = JSON.parse(JSON.stringify(existingScene));
  scene.updatedAt = nowIso;
  const changes: string[] = [];

  if (colorMatch) {
    scene.printProfile.filamentColor = colorMatch.hex;
    for (const n of scene.nodes) {
      if (n.operation !== 'subtract') n.color = colorMatch.hex;
    }
    changes.push(`Farbe auf ${colorMatch.label} (${colorMatch.hex}) geändert`);
  }

  // Percentage scaling (e.g., "20% größer", "skaliere auf 150%", "30% höher")
  const pctMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*%/);
  const pctVal = pctMatch ? Number(pctMatch[1].replace(',', '.')) : null;
  const mmMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*mm/);
  const mmVal = mmMatch ? Number(mmMatch[1].replace(',', '.')) : null;

  // Height adjustments
  if (/\b(höher|hoeher|höhe|hoehe|taller|height|länger|laenger)\b/i.test(lower)) {
    for (const n of scene.nodes) {
      if (n.operation === 'subtract') continue;
      if (pctVal) {
        const factor = pctVal > 100 ? pctVal / 100 : 1 + pctVal / 100;
        if (n.params.height) n.params.height = Number((n.params.height * factor).toFixed(1));
        else n.scale[2] = Number((n.scale[2] * factor).toFixed(2));
      } else if (mmVal) {
        if (/\b(um|plus|\+)\b/i.test(lower) && n.params.height) {
          n.params.height = Number((n.params.height + mmVal).toFixed(1));
        } else if (n.params.height) {
          n.params.height = mmVal;
        }
      } else if (n.params.height) {
        n.params.height = Number((n.params.height * 1.25).toFixed(1));
      }
    }
    changes.push(`Objekthöhe angepasst`);
  }

  // Width / diameter adjustments
  if (/\b(breiter|breite|wider|width|durchmesser|größer|groesser|skalier)\b/i.test(lower)) {
    const factor = pctVal ? (pctVal > 100 ? pctVal / 100 : 1 + pctVal / 100) : 1.2;
    for (const n of scene.nodes) {
      if (mmVal && !pctVal) {
        if (n.params.width !== undefined) n.params.width = mmVal;
        if (n.params.outerRadius !== undefined) n.params.outerRadius = mmVal / 2;
        if (n.params.radiusBottom !== undefined) n.params.radiusBottom = mmVal / 2;
        if (n.params.radiusTop !== undefined) n.params.radiusTop = mmVal / 2;
      } else {
        n.scale[0] = Number((n.scale[0] * factor).toFixed(2));
        n.scale[1] = Number((n.scale[1] * factor).toFixed(2));
        if (/\b(skalier|größer|groesser)\b/i.test(lower)) {
          n.scale[2] = Number((n.scale[2] * factor).toFixed(2));
        }
      }
    }
    changes.push(`Breite / Skalierung angepasst`);
  }

  // Smaller / flatter
  if (/\b(kleiner|flacher|kürzer|kuerzer|schmaler|smaller|shorter)\b/i.test(lower)) {
    const factor = pctVal ? Math.max(0.25, 1 - pctVal / 100) : 0.8;
    for (const n of scene.nodes) {
      if (/\b(flacher|kürzer|kuerzer|shorter)\b/i.test(lower)) {
        if (n.params.height) n.params.height = Number((n.params.height * factor).toFixed(1));
        else n.scale[2] = Number((n.scale[2] * factor).toFixed(2));
      } else {
        n.scale[0] = Number((n.scale[0] * factor).toFixed(2));
        n.scale[1] = Number((n.scale[1] * factor).toFixed(2));
        n.scale[2] = Number((n.scale[2] * factor).toFixed(2));
      }
    }
    changes.push(`Abmessungen reduziert (${Math.round(factor * 100)}%)`);
  }

  // Tooth / rib count modification
  if (/\b(zähne|zaehne|teeth|rippen|ribs|fächer|faecher|slots)\b/i.test(lower)) {
    const countMatch = lower.match(/(\d+)/);
    const num = countMatch ? Number(countMatch[1]) : null;
    for (const n of scene.nodes) {
      if (n.type === 'gear') {
        n.params.teeth = num ? Math.max(6, Math.min(80, num)) : (n.params.teeth || 20) + 6;
        changes.push(`Zähnezahl auf ${n.params.teeth} gesetzt`);
      } else if (n.type === 'twisted_vase') {
        n.params.ribCount = num ? Math.max(0, Math.min(36, num)) : (n.params.ribCount || 12) + 4;
        changes.push(`Rippenanzahl auf ${n.params.ribCount} gesetzt`);
      } else if (n.type === 'hex_organizer') {
        n.params.slotsX = num ? Math.max(1, Math.min(5, num)) : (n.params.slotsX || 3) + 1;
        changes.push(`Kammer-Unterteilung auf ${n.params.slotsX}×${n.params.slotsY || 2} geändert`);
      }
    }
  }

  // Add hole / bore / cutout ("loch", "bohrung", "ausschnitt", "schraubloch")
  if (/\b(loch|löcher|loecher|bohrung|bore|hole|aushöhlen|durchbruch)\b/i.test(lower)) {
    const holeDia = mmVal || 8;
    const holeRad = Math.max(1, holeDia / 2);
    const mainNode = scene.nodes[0];
    if (mainNode && (mainNode.type === 'cylinder' || mainNode.type === 'gear')) {
      if (mainNode.type === 'cylinder') mainNode.params.innerRadius = holeRad;
      if (mainNode.type === 'gear') mainNode.params.boreRadius = holeRad;
    }
    scene.nodes.push({
      id: `node-hole-${Date.now()}`,
      name: `Bohrung Ø${holeDia}mm`,
      type: 'cylinder',
      operation: 'subtract',
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: '#f43f5e',
      params: { radiusBottom: holeRad, radiusTop: holeRad, height: 60, segments: 32 },
    });
    changes.push(`Präzisionsbohrung (Ø${holeDia}mm) hinzugefügt`);
  }

  // Add extra feature / attachment ("füge ... hinzu", "zylinder", "ring", "sockel", "griff", "knauf")
  if (
    /\b(füge|fuege|add|hinzu|oben|sockel|basis|ring|knauf|griff|kugel|zylinder)\b/i.test(lower) &&
    !/\b(loch|bohrung)\b/i.test(lower)
  ) {
    const refHeight = scene.nodes[0]?.params?.height || 35;
    if (/\b(ring|öse|oese|torus|henkel)\b/i.test(lower)) {
      scene.nodes.push({
        id: `node-ring-${Date.now()}`,
        name: 'Befestigungsring / Öse',
        type: 'torus',
        operation: 'union',
        position: [0, 0, refHeight - 4],
        rotation: [90, 0, 0],
        scale: [1, 1, 1],
        color: scene.printProfile.filamentColor,
        params: { radius: mmVal ? mmVal / 2 : 14, tubeRadius: 3.5 },
      });
      changes.push(`Befestigungsring / Öse hinzugefügt`);
    } else if (/\b(sockel|basis|base|platte|boden)\b/i.test(lower)) {
      scene.nodes.unshift({
        id: `node-base-${Date.now()}`,
        name: 'Verstärkte Sockelplatte',
        type: 'box',
        operation: 'union',
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        color: scene.printProfile.filamentColor,
        params: { width: mmVal || 76, depth: mmVal || 76, height: 6, bevel: 4 },
      });
      changes.push(`Verstärkte Sockelplatte hinzugefügt`);
    } else if (/\b(kugel|knauf|kuppel|sphere)\b/i.test(lower)) {
      scene.nodes.push({
        id: `node-knob-${Date.now()}`,
        name: 'Kugelknauf',
        type: 'sphere',
        operation: 'union',
        position: [0, 0, refHeight - 4],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        color: scene.printProfile.filamentColor,
        params: { radius: mmVal ? mmVal / 2 : 14, domeOnly: 0 },
      });
      changes.push(`Kugelknauf an Oberseite angefügt`);
    } else if (changes.length === 0) {
      scene.nodes.push({
        id: `node-boss-${Date.now()}`,
        name: 'Zylinder-Aufsatz',
        type: 'cylinder',
        operation: 'union',
        position: [0, 0, refHeight - 2],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        color: scene.printProfile.filamentColor,
        params: { radiusBottom: 14, radiusTop: 12, innerRadius: 5, height: mmVal || 18, segments: 36 },
      });
      changes.push(`Zylindrischen Aufsatz (${mmVal || 18}mm) ergänzt`);
    }
  }

  // Twist / rotation
  if (/\b(dreh|twist|torsion|spiral|rotier)\b/i.test(lower)) {
    for (const n of scene.nodes) {
      if (n.type === 'twisted_vase') {
        n.params.twistDeg = (n.params.twistDeg || 90) + 60;
      } else {
        n.rotation[2] = ((n.rotation[2] || 0) + 30) % 360;
      }
    }
    changes.push(`Torsions-/Rotationswinkel erhöht`);
  }

  // If no specific rule matched, apply a visible parametric refinement
  if (changes.length === 0) {
    const primary = scene.nodes[0];
    if (primary) {
      if (primary.params.height) {
        primary.params.height = Number((primary.params.height * 1.15).toFixed(1));
      } else {
        primary.scale[2] = Number((primary.scale[2] * 1.15).toFixed(2));
      }
      if (primary.params.bevel !== undefined) {
        primary.params.bevel = Math.min(12, (primary.params.bevel || 2) + 2);
      }
      changes.push(`Geometrie gemäß "${cleanPrompt}" verfeinert (+15% Profilhöhe & Kantenfase)`);
    }
  }

  const summary = changes.join(' · ');
  scene.promptHistory.unshift({
    id: `ph-${Date.now()}`,
    prompt: cleanPrompt,
    summary,
    engine: 'Antigravity Parametric CAD',
    timestamp: nowIso,
  });

  return { scene, summary, engine: 'Antigravity Parametric CAD' };
}

/**
 * Uses Google Gemini AI (if available via Home Assistant Google Generative AI integration)
 * combined with Antigravity Parametric CAD verification to synthesize or mutate the 3D SceneSpec.
 */
export async function generateOrModify3dSceneWithAi(
  prompt: string,
  existingScene?: SceneSpec | null,
  customApiKey?: string
): Promise<{ scene: SceneSpec; summary: string; engine: string }> {
  const apiKey = customApiKey || discoverGeminiApiKey();

  if (apiKey) {
    try {
      const model = await resolveGeminiModel(apiKey);
      const systemInstruction = `Du bist der Antigravity 3D-CAD Kernel für das Home Assistant Modul "thassi.3dprint" (Bambu Lab P1S 256x256x256mm).
Erzeuge oder verändere das 3D-Objekt basierend auf dem User-Prompt.
Verfügbare PrimitiveTypes:
- "box": params { width, depth, height, bevel, wallThickness }
- "cylinder": params { radiusBottom, radiusTop, innerRadius, height, segments }
- "sphere": params { radius, domeOnly (0|1) }
- "cone": params { radiusBottom, radiusTop, innerRadius, height, segments }
- "torus": params { radius, tubeRadius }
- "gear": params { teeth, outerRadius, toothDepth, boreRadius, height }
- "twisted_vase": params { radiusBottom, radiusTop, height, wallThickness, twistDeg, ribCount, ribAmplitude }
- "bracket": params { width, depth, height, thickness, lipHeight }
- "hex_organizer": params { width, depth, height, wallThickness, slotsX, slotsY }

Jeder Node hat:
{
  "id": "string",
  "name": "Kurzer deutscher Bauteilname",
  "type": PrimitiveType,
  "operation": "union" | "subtract",
  "position": [x, y, z],
  "rotation": [rx, ry, rz],
  "scale": [sx, sy, sz],
  "color": "#HEX",
  "params": { ... }
}

Antworte AUSSCHLIESSLICH mit validem JSON ohne Markdown-Block:
{
  "title": "Projekttitel",
  "description": "Kurzbeschreibung",
  "filamentColor": "#00AE42",
  "filamentType": "PLA",
  "infillPercent": 20,
  "layerHeightMm": 0.2,
  "summary": "Was wurde erstellt oder geändert",
  "nodes": [ ... ]
}`;

      const userMessage = existingScene
        ? `Aktuelles 3D-Modell (JSON):\n${JSON.stringify({
            title: existingScene.title,
            description: existingScene.description,
            printProfile: existingScene.printProfile,
            nodes: existingScene.nodes,
          })}\n\nUser-Änderungsprompt: "${prompt}"\nModifiziere das bestehende Modell entsprechend dem Prompt.`
        : `Erstelle ein neues druckbares 3D-Modell für folgenden User-Prompt: "${prompt}"`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: `${systemInstruction}\n\n${userMessage}` }] }],
            generationConfig: {
              temperature: 0.25,
              responseMimeType: 'application/json',
            },
          }),
          signal: AbortSignal.timeout(12000),
        }
      );

      if (res.ok) {
        const data = (await res.json()) as {
          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        };
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const cleaned = rawText
          .replace(/^```json\s*/i, '')
          .replace(/```\s*$/, '')
          .trim();
        const parsed = JSON.parse(cleaned) as {
          title?: string;
          description?: string;
          filamentColor?: string;
          filamentType?: 'PLA' | 'PETG' | 'ABS' | 'ASA' | 'TPU';
          infillPercent?: number;
          layerHeightMm?: number;
          summary?: string;
          nodes?: PrimitiveNode[];
        };

        if (Array.isArray(parsed.nodes) && parsed.nodes.length > 0) {
          const validTypes = new Set<PrimitiveType>([
            'box',
            'cylinder',
            'sphere',
            'cone',
            'torus',
            'gear',
            'twisted_vase',
            'bracket',
            'hex_organizer',
          ]);

          const sanitizedNodes: PrimitiveNode[] = parsed.nodes.map((n, idx) => ({
            id: n.id || `node-ai-${idx}-${Date.now()}`,
            name: n.name || `Bauteil ${idx + 1}`,
            type: validTypes.has(n.type) ? n.type : 'box',
            operation: n.operation === 'subtract' ? 'subtract' : 'union',
            position: Array.isArray(n.position) && n.position.length === 3 ? n.position.map(Number) as [number, number, number] : [0, 0, 0],
            rotation: Array.isArray(n.rotation) && n.rotation.length === 3 ? n.rotation.map(Number) as [number, number, number] : [0, 0, 0],
            scale: Array.isArray(n.scale) && n.scale.length === 3 ? n.scale.map((v) => Math.max(0.1, Number(v) || 1)) as [number, number, number] : [1, 1, 1],
            color: n.color || parsed.filamentColor || existingScene?.printProfile.filamentColor || '#00AE42',
            params: typeof n.params === 'object' && n.params ? n.params : { width: 40, depth: 40, height: 30 },
          }));

          const nowIso = new Date().toISOString();
          const summaryText = parsed.summary || `3D-Modell per ${model} aktualisiert`;
          const engineName = `Antigravity AI (${model})`;

          const nextScene: SceneSpec = {
            projectId: existingScene?.projectId || `proj-${Date.now()}`,
            title: parsed.title || existingScene?.title || prompt.slice(0, 40),
            description: parsed.description || existingScene?.description || prompt,
            createdAt: existingScene?.createdAt || nowIso,
            updatedAt: nowIso,
            buildPlateMm: [256, 256, 256],
            printProfile: {
              ...(existingScene?.printProfile || DEFAULT_PRINT_PROFILE),
              filamentColor: parsed.filamentColor || existingScene?.printProfile.filamentColor || '#00AE42',
              filamentType: parsed.filamentType || existingScene?.printProfile.filamentType || 'PLA',
              infillPercent: Number(parsed.infillPercent || existingScene?.printProfile.infillPercent || 20),
              layerHeightMm: Number(parsed.layerHeightMm || existingScene?.printProfile.layerHeightMm || 0.2),
            },
            nodes: sanitizedNodes,
            promptHistory: [
              {
                id: `ph-${Date.now()}`,
                prompt,
                summary: summaryText,
                engine: engineName,
                timestamp: nowIso,
              },
              ...(existingScene?.promptHistory || []),
            ].slice(0, 30),
          };

          return { scene: nextScene, summary: summaryText, engine: engineName };
        }
      }
    } catch {
      // Fallback to deterministic Antigravity Parametric CAD Engine
    }
  }

  return runLocalAntigravityCadEngine(prompt, existingScene);
}
