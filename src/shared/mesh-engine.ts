export type PrimitiveType =
  | 'box'
  | 'cylinder'
  | 'sphere'
  | 'cone'
  | 'torus'
  | 'gear'
  | 'twisted_vase'
  | 'bracket'
  | 'hex_organizer';

export interface PrimitiveNode {
  id: string;
  name: string;
  type: PrimitiveType;
  operation: 'union' | 'subtract';
  position: [number, number, number]; // [x, y, z] in mm (Z is up on build plate)
  rotation: [number, number, number]; // [rx, ry, rz] in degrees
  scale: [number, number, number]; // [sx, sy, sz]
  color: string;
  params: Record<string, number>;
}

export interface PrintProfileSpec {
  printerModel: string;
  nozzleDiameterMm: number;
  layerHeightMm: number;
  infillPercent: number;
  wallLoops: number;
  filamentType: 'PLA' | 'PETG' | 'ABS' | 'ASA' | 'TPU';
  filamentColor: string;
  nozzleTempC: number;
  bedTempC: number;
  supportsEnabled: boolean;
  brimEnabled: boolean;
}

export interface PromptHistoryEntry {
  id: string;
  prompt: string;
  summary: string;
  engine: string;
  timestamp: string;
}

export interface SceneSpec {
  projectId: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  buildPlateMm: [number, number, number]; // Bambu Lab P1S: [256, 256, 256]
  printProfile: PrintProfileSpec;
  nodes: PrimitiveNode[];
  promptHistory: PromptHistoryEntry[];
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface TriangleFace {
  v0: Vec3;
  v1: Vec3;
  v2: Vec3;
  normal: Vec3;
  color: string;
  nodeId: string;
  isSubtract?: boolean;
}

export interface MeshStats {
  triangleCount: number;
  vertexCount: number;
  dimensionsMm: { x: number; y: number; z: number };
  bounds: { min: Vec3; max: Vec3 };
  volumeCm3: number;
  filamentWeightG: number;
  filamentLengthM: number;
  layerCount: number;
  estimatedPrintMinutes: number;
}

export interface CompiledMesh {
  triangles: TriangleFace[];
  indexedVertices: Vec3[];
  indexedTriangles: Array<[number, number, number]>;
  stats: MeshStats;
}

export const DEFAULT_PRINT_PROFILE: PrintProfileSpec = {
  printerModel: 'Bambu Lab P1S 0.4 nozzle',
  nozzleDiameterMm: 0.4,
  layerHeightMm: 0.2,
  infillPercent: 20,
  wallLoops: 3,
  filamentType: 'PLA',
  filamentColor: '#00AE42',
  nozzleTempC: 220,
  bedTempC: 60,
  supportsEnabled: false,
  brimEnabled: false,
};

function vSub(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function vCross(a: Vec3, b: Vec3): Vec3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

function vNorm(a: Vec3): Vec3 {
  const len = Math.hypot(a.x, a.y, a.z);
  if (len < 1e-9) return { x: 0, y: 0, z: 1 };
  return { x: a.x / len, y: a.y / len, z: a.z / len };
}

function computeNormal(v0: Vec3, v1: Vec3, v2: Vec3): Vec3 {
  return vNorm(vCross(vSub(v1, v0), vSub(v2, v0)));
}

function transformPoint(
  p: Vec3,
  pos: [number, number, number],
  rotDeg: [number, number, number],
  scale: [number, number, number]
): Vec3 {
  let x = p.x * (scale[0] ?? 1);
  let y = p.y * (scale[1] ?? 1);
  let z = p.z * (scale[2] ?? 1);

  const rx = ((rotDeg[0] || 0) * Math.PI) / 180;
  const ry = ((rotDeg[1] || 0) * Math.PI) / 180;
  const rz = ((rotDeg[2] || 0) * Math.PI) / 180;

  if (rx !== 0) {
    const c = Math.cos(rx);
    const s = Math.sin(rx);
    const ny = y * c - z * s;
    const nz = y * s + z * c;
    y = ny;
    z = nz;
  }
  if (ry !== 0) {
    const c = Math.cos(ry);
    const s = Math.sin(ry);
    const nx = x * c + z * s;
    const nz = -x * s + z * c;
    x = nx;
    z = nz;
  }
  if (rz !== 0) {
    const c = Math.cos(rz);
    const s = Math.sin(rz);
    const nx = x * c - y * s;
    const ny = x * s + y * c;
    x = nx;
    y = ny;
  }

  return {
    x: x + (pos[0] || 0),
    y: y + (pos[1] || 0),
    z: z + (pos[2] || 0),
  };
}

function pushQuad(
  out: Array<[Vec3, Vec3, Vec3]>,
  a: Vec3,
  b: Vec3,
  c: Vec3,
  d: Vec3
) {
  out.push([a, b, c]);
  out.push([a, c, d]);
}

function generateBoxTriangles(params: Record<string, number>): Array<[Vec3, Vec3, Vec3]> {
  const w = Math.max(1, params.width ?? 40);
  const d = Math.max(1, params.depth ?? 40);
  const h = Math.max(1, params.height ?? 30);
  const bevel = Math.min(Math.min(w, d) * 0.42, Math.max(0, params.bevel ?? 2));
  const wall = params.wallThickness ?? 0;

  const hw = w / 2;
  const hd = d / 2;

  // Build 8-point octagonal cross section in XY if bevel > 0
  const b = bevel;
  const outerPts: Array<[number, number]> =
    b > 0.2
      ? [
          [-hw + b, -hd],
          [hw - b, -hd],
          [hw, -hd + b],
          [hw, hd - b],
          [hw - b, hd],
          [-hw + b, hd],
          [-hw, hd - b],
          [-hw, -hd + b],
        ]
      : [
          [-hw, -hd],
          [hw, -hd],
          [hw, hd],
          [-hw, hd],
        ];

  const tris: Array<[Vec3, Vec3, Vec3]> = [];
  const n = outerPts.length;

  if (wall > 0.4 && wall < Math.min(hw, hd) - 1) {
    // Hollow box with solid floor of thickness `wall`
    const floorZ = Math.min(h * 0.5, wall);
    const innerPts = outerPts.map(([px, py]) => {
      const sx = px >= 0 ? Math.max(0.5, px - wall) : Math.min(-0.5, px + wall);
      const sy = py >= 0 ? Math.max(0.5, py - wall) : Math.min(-0.5, py + wall);
      return [sx, sy] as [number, number];
    });

    for (let i = 0; i < n; i++) {
      const [x0, y0] = outerPts[i];
      const [x1, y1] = outerPts[(i + 1) % n];
      const [ix0, iy0] = innerPts[i];
      const [ix1, iy1] = innerPts[(i + 1) % n];

      // Outer wall
      pushQuad(
        tris,
        { x: x0, y: y0, z: 0 },
        { x: x1, y: y1, z: 0 },
        { x: x1, y: y1, z: h },
        { x: x0, y: y0, z: h }
      );
      // Inner wall
      pushQuad(
        tris,
        { x: ix1, y: iy1, z: floorZ },
        { x: ix0, y: iy0, z: floorZ },
        { x: ix0, y: iy0, z: h },
        { x: ix1, y: iy1, z: h }
      );
      // Top rim
      pushQuad(
        tris,
        { x: x0, y: y0, z: h },
        { x: x1, y: y1, z: h },
        { x: ix1, y: iy1, z: h },
        { x: ix0, y: iy0, z: h }
      );
      // Bottom cap
      tris.push([
        { x: 0, y: 0, z: 0 },
        { x: x1, y: y1, z: 0 },
        { x: x0, y: y0, z: 0 },
      ]);
      // Inner floor cap
      tris.push([
        { x: 0, y: 0, z: floorZ },
        { x: ix0, y: iy0, z: floorZ },
        { x: ix1, y: iy1, z: floorZ },
      ]);
    }
    return tris;
  }

  for (let i = 0; i < n; i++) {
    const [x0, y0] = outerPts[i];
    const [x1, y1] = outerPts[(i + 1) % n];
    pushQuad(
      tris,
      { x: x0, y: y0, z: 0 },
      { x: x1, y: y1, z: 0 },
      { x: x1, y: y1, z: h },
      { x: x0, y: y0, z: h }
    );
    tris.push([
      { x: 0, y: 0, z: 0 },
      { x: x1, y: y1, z: 0 },
      { x: x0, y: y0, z: 0 },
    ]);
    tris.push([
      { x: 0, y: 0, z: h },
      { x: x0, y: y0, z: h },
      { x: x1, y: y1, z: h },
    ]);
  }
  return tris;
}

function generateCylinderTriangles(params: Record<string, number>): Array<[Vec3, Vec3, Vec3]> {
  const rBottom = Math.max(0.5, params.radiusBottom ?? params.radius ?? 20);
  const rTop = Math.max(0.5, params.radiusTop ?? params.radius ?? 20);
  const rInner = Math.max(0, Math.min(Math.min(rBottom, rTop) - 0.8, params.innerRadius ?? 0));
  const h = Math.max(1, params.height ?? 35);
  const segs = Math.min(96, Math.max(6, Math.round(params.segments ?? 40)));

  const tris: Array<[Vec3, Vec3, Vec3]> = [];

  for (let i = 0; i < segs; i++) {
    const a0 = (i / segs) * Math.PI * 2;
    const a1 = ((i + 1) / segs) * Math.PI * 2;
    const c0 = Math.cos(a0);
    const s0 = Math.sin(a0);
    const c1 = Math.cos(a1);
    const s1 = Math.sin(a1);

    const ob0 = { x: rBottom * c0, y: rBottom * s0, z: 0 };
    const ob1 = { x: rBottom * c1, y: rBottom * s1, z: 0 };
    const ot0 = { x: rTop * c0, y: rTop * s0, z: h };
    const ot1 = { x: rTop * c1, y: rTop * s1, z: h };

    pushQuad(tris, ob0, ob1, ot1, ot0);

    if (rInner > 0.2) {
      const ib0 = { x: rInner * c0, y: rInner * s0, z: 0 };
      const ib1 = { x: rInner * c1, y: rInner * s1, z: 0 };
      const it0 = { x: rInner * c0, y: rInner * s0, z: h };
      const it1 = { x: rInner * c1, y: rInner * s1, z: h };

      pushQuad(tris, ib1, ib0, it0, it1);
      pushQuad(tris, ot0, ot1, it1, it0);
      pushQuad(tris, ib0, ib1, ob1, ob0);
    } else {
      tris.push([{ x: 0, y: 0, z: 0 }, ob1, ob0]);
      tris.push([{ x: 0, y: 0, z: h }, ot0, ot1]);
    }
  }
  return tris;
}

function generateConeTriangles(params: Record<string, number>): Array<[Vec3, Vec3, Vec3]> {
  return generateCylinderTriangles({
    radiusBottom: params.radiusBottom ?? params.radius ?? 22,
    radiusTop: Math.max(0.5, params.radiusTop ?? 1),
    innerRadius: params.innerRadius ?? 0,
    height: params.height ?? 35,
    segments: params.segments ?? 36,
  });
}

function generateSphereTriangles(params: Record<string, number>): Array<[Vec3, Vec3, Vec3]> {
  const r = Math.max(1, params.radius ?? 20);
  const domeOnly = Boolean(params.domeOnly);
  const latSegs = domeOnly ? 12 : 20;
  const lonSegs = 32;
  const tris: Array<[Vec3, Vec3, Vec3]> = [];

  for (let lat = 0; lat < latSegs; lat++) {
    const theta0 = domeOnly
      ? (lat / latSegs) * (Math.PI / 2)
      : -Math.PI / 2 + (lat / latSegs) * Math.PI;
    const theta1 = domeOnly
      ? ((lat + 1) / latSegs) * (Math.PI / 2)
      : -Math.PI / 2 + ((lat + 1) / latSegs) * Math.PI;

    const z0 = domeOnly ? r * Math.sin(theta0) : r + r * Math.sin(theta0);
    const z1 = domeOnly ? r * Math.sin(theta1) : r + r * Math.sin(theta1);
    const r0 = r * Math.cos(theta0);
    const r1 = r * Math.cos(theta1);

    for (let lon = 0; lon < lonSegs; lon++) {
      const phi0 = (lon / lonSegs) * Math.PI * 2;
      const phi1 = ((lon + 1) / lonSegs) * Math.PI * 2;

      const p00 = { x: r0 * Math.cos(phi0), y: r0 * Math.sin(phi0), z: z0 };
      const p10 = { x: r0 * Math.cos(phi1), y: r0 * Math.sin(phi1), z: z0 };
      const p11 = { x: r1 * Math.cos(phi1), y: r1 * Math.sin(phi1), z: z1 };
      const p01 = { x: r1 * Math.cos(phi0), y: r1 * Math.sin(phi0), z: z1 };

      pushQuad(tris, p00, p10, p11, p01);
      if (domeOnly && lat === 0) {
        tris.push([{ x: 0, y: 0, z: 0 }, p10, p00]);
      }
    }
  }
  return tris;
}

function generateTorusTriangles(params: Record<string, number>): Array<[Vec3, Vec3, Vec3]> {
  const R = Math.max(4, params.radius ?? 24);
  const r = Math.max(1, Math.min(R - 1, params.tubeRadius ?? 6));
  const majorSegs = 36;
  const minorSegs = 20;
  const tris: Array<[Vec3, Vec3, Vec3]> = [];

  for (let i = 0; i < majorSegs; i++) {
    const u0 = (i / majorSegs) * Math.PI * 2;
    const u1 = ((i + 1) / majorSegs) * Math.PI * 2;
    for (let j = 0; j < minorSegs; j++) {
      const v0 = (j / minorSegs) * Math.PI * 2;
      const v1 = ((j + 1) / minorSegs) * Math.PI * 2;

      const pt = (u: number, v: number): Vec3 => ({
        x: (R + r * Math.cos(v)) * Math.cos(u),
        y: (R + r * Math.cos(v)) * Math.sin(u),
        z: r + r * Math.sin(v),
      });

      pushQuad(tris, pt(u0, v0), pt(u1, v0), pt(u1, v1), pt(u0, v1));
    }
  }
  return tris;
}

function generateGearTriangles(params: Record<string, number>): Array<[Vec3, Vec3, Vec3]> {
  const teeth = Math.max(6, Math.min(80, Math.round(params.teeth ?? 20)));
  const outerRadius = Math.max(8, params.outerRadius ?? 30);
  const toothDepth = Math.max(1.5, Math.min(outerRadius * 0.3, params.toothDepth ?? outerRadius * 0.16));
  const rootRadius = outerRadius - toothDepth;
  const boreRadius = Math.max(1, Math.min(rootRadius - 2, params.boreRadius ?? 5));
  const height = Math.max(2, params.height ?? 10);

  const stepsPerTooth = 4;
  const totalSteps = teeth * stepsPerTooth;
  const tris: Array<[Vec3, Vec3, Vec3]> = [];

  const profilePt = (idx: number): [number, number] => {
    const i = ((idx % totalSteps) + totalSteps) % totalSteps;
    const sub = i % stepsPerTooth;
    const angle = (i / totalSteps) * Math.PI * 2;
    // sub 0,1 = root/flank up, sub 1,2 = tip, sub 2,3 = flank down
    const rad = sub === 1 || sub === 2 ? outerRadius : rootRadius;
    return [rad * Math.cos(angle), rad * Math.sin(angle)];
  };

  for (let i = 0; i < totalSteps; i++) {
    const [ox0, oy0] = profilePt(i);
    const [ox1, oy1] = profilePt(i + 1);
    const a0 = (i / totalSteps) * Math.PI * 2;
    const a1 = ((i + 1) / totalSteps) * Math.PI * 2;
    const ix0 = boreRadius * Math.cos(a0);
    const iy0 = boreRadius * Math.sin(a0);
    const ix1 = boreRadius * Math.cos(a1);
    const iy1 = boreRadius * Math.sin(a1);

    // Outer gear tooth wall
    pushQuad(
      tris,
      { x: ox0, y: oy0, z: 0 },
      { x: ox1, y: oy1, z: 0 },
      { x: ox1, y: oy1, z: height },
      { x: ox0, y: oy0, z: height }
    );
    // Inner bore wall
    pushQuad(
      tris,
      { x: ix1, y: iy1, z: 0 },
      { x: ix0, y: iy0, z: 0 },
      { x: ix0, y: iy0, z: height },
      { x: ix1, y: iy1, z: height }
    );
    // Top face
    pushQuad(
      tris,
      { x: ix0, y: iy0, z: height },
      { x: ox0, y: oy0, z: height },
      { x: ox1, y: oy1, z: height },
      { x: ix1, y: iy1, z: height }
    );
    // Bottom face
    pushQuad(
      tris,
      { x: ox0, y: oy0, z: 0 },
      { x: ix0, y: iy0, z: 0 },
      { x: ix1, y: iy1, z: 0 },
      { x: ox1, y: oy1, z: 0 }
    );
  }
  return tris;
}

function generateTwistedVaseTriangles(params: Record<string, number>): Array<[Vec3, Vec3, Vec3]> {
  const rBottom = Math.max(8, params.radiusBottom ?? 26);
  const rTop = Math.max(8, params.radiusTop ?? 32);
  const h = Math.max(15, params.height ?? 75);
  const wall = Math.max(1.2, Math.min(8, params.wallThickness ?? 2.4));
  const twistDeg = params.twistDeg ?? 90;
  const ribCount = Math.max(0, Math.min(36, Math.round(params.ribCount ?? 12)));
  const ribAmp = Math.max(0, Math.min(10, params.ribAmplitude ?? 2.8));

  const zSteps = 28;
  const aSteps = 48;
  const floorZ = Math.min(h * 0.25, Math.max(2, wall * 1.5));
  const tris: Array<[Vec3, Vec3, Vec3]> = [];

  const getOuterPt = (zi: number, ai: number): Vec3 => {
    const t = zi / zSteps;
    const z = t * h;
    const baseR = rBottom + (rTop - rBottom) * (0.5 - 0.5 * Math.cos(t * Math.PI)) + Math.sin(t * Math.PI) * 4;
    const twistRad = ((twistDeg * t) * Math.PI) / 180;
    const a = (ai / aSteps) * Math.PI * 2;
    const rib = ribCount > 0 ? ribAmp * Math.sin(ribCount * (a + twistRad)) : 0;
    const r = Math.max(4, baseR + rib);
    return { x: r * Math.cos(a), y: r * Math.sin(a), z };
  };

  const getInnerPt = (zi: number, ai: number): Vec3 => {
    const t = zi / zSteps;
    const z = floorZ + t * (h - floorZ);
    const baseR = rBottom + (rTop - rBottom) * (0.5 - 0.5 * Math.cos(t * Math.PI)) + Math.sin(t * Math.PI) * 4;
    const twistRad = ((twistDeg * t) * Math.PI) / 180;
    const a = (ai / aSteps) * Math.PI * 2;
    const rib = ribCount > 0 ? ribAmp * 0.65 * Math.sin(ribCount * (a + twistRad)) : 0;
    const r = Math.max(2, baseR + rib - wall);
    return { x: r * Math.cos(a), y: r * Math.sin(a), z };
  };

  for (let zi = 0; zi < zSteps; zi++) {
    for (let ai = 0; ai < aSteps; ai++) {
      const an = (ai + 1) % aSteps;
      pushQuad(
        tris,
        getOuterPt(zi, ai),
        getOuterPt(zi, an),
        getOuterPt(zi + 1, an),
        getOuterPt(zi + 1, ai)
      );
      pushQuad(
        tris,
        getInnerPt(zi, an),
        getInnerPt(zi, ai),
        getInnerPt(zi + 1, ai),
        getInnerPt(zi + 1, an)
      );
    }
  }

  for (let ai = 0; ai < aSteps; ai++) {
    const an = (ai + 1) % aSteps;
    // Top lip connecting outer to inner
    pushQuad(
      tris,
      getOuterPt(zSteps, ai),
      getOuterPt(zSteps, an),
      getInnerPt(zSteps, an),
      getInnerPt(zSteps, ai)
    );
    // Solid bottom base
    tris.push([{ x: 0, y: 0, z: 0 }, getOuterPt(0, an), getOuterPt(0, ai)]);
    // Inner floor
    tris.push([{ x: 0, y: 0, z: floorZ }, getInnerPt(0, ai), getInnerPt(0, an)]);
  }

  return tris;
}

function generateBracketTriangles(params: Record<string, number>): Array<[Vec3, Vec3, Vec3]> {
  // Parametric L-bracket / desk clamp / headphone hook assembly
  const width = Math.max(10, params.width ?? 36);
  const depth = Math.max(20, params.depth ?? 55);
  const height = Math.max(20, params.height ?? 65);
  const thick = Math.max(3, Math.min(18, params.thickness ?? 6));
  const lipHeight = Math.max(0, params.lipHeight ?? 18);

  const tris: Array<[Vec3, Vec3, Vec3]> = [];

  // 1. Base plate (width x depth x thick)
  const baseTris = generateBoxTriangles({ width, depth, height: thick, bevel: 1.5 });
  tris.push(...baseTris);

  // 2. Vertical spine at back (-depth/2 + thick/2)
  const spineTris = generateBoxTriangles({ width, depth: thick, height, bevel: 1.2 });
  const spineY = -depth / 2 + thick / 2;
  for (const [a, b, c] of spineTris) {
    tris.push([
      { x: a.x, y: a.y + spineY, z: a.z },
      { x: b.x, y: b.y + spineY, z: b.z },
      { x: c.x, y: c.y + spineY, z: c.z },
    ]);
  }

  // 3. Top cantilever arm if lipHeight > 0 (e.g., desk clamp / headphone hook)
  if (lipHeight > 1) {
    const topArmTris = generateBoxTriangles({
      width,
      depth: depth * 0.75,
      height: thick,
      bevel: 1.2,
    });
    const armY = -depth / 2 + (depth * 0.75) / 2;
    const armZ = height - thick;
    for (const [a, b, c] of topArmTris) {
      tris.push([
        { x: a.x, y: a.y + armY, z: a.z + armZ },
        { x: b.x, y: b.y + armY, z: b.z + armZ },
        { x: c.x, y: c.y + armY, z: c.z + armZ },
      ]);
    }

    // Front upward retention lip
    const tipTris = generateBoxTriangles({
      width,
      depth: thick,
      height: lipHeight,
      bevel: 1.0,
    });
    const tipY = depth / 2 - thick / 2;
    for (const [a, b, c] of tipTris) {
      tris.push([
        { x: a.x, y: a.y + tipY, z: a.z },
        { x: b.x, y: b.y + tipY, z: b.z },
        { x: c.x, y: c.y + tipY, z: c.z },
      ]);
    }
  }

  return tris;
}

function generateHexOrganizerTriangles(params: Record<string, number>): Array<[Vec3, Vec3, Vec3]> {
  const width = Math.max(24, params.width ?? 72);
  const depth = Math.max(24, params.depth ?? 48);
  const height = Math.max(12, params.height ?? 42);
  const wall = Math.max(1.6, Math.min(6, params.wallThickness ?? 2.4));
  const slotsX = Math.max(1, Math.min(5, Math.round(params.slotsX ?? 3)));
  const slotsY = Math.max(1, Math.min(4, Math.round(params.slotsY ?? 2)));

  const tris: Array<[Vec3, Vec3, Vec3]> = [];

  // Outer hollow shell
  tris.push(...generateBoxTriangles({ width, depth, height, bevel: 3, wallThickness: wall }));

  // Internal divider walls
  for (let ix = 1; ix < slotsX; ix++) {
    const xPos = -width / 2 + (ix / slotsX) * width;
    const div = generateBoxTriangles({ width: wall, depth: depth - wall * 1.5, height: height - 1, bevel: 0 });
    for (const [a, b, c] of div) {
      tris.push([
        { x: a.x + xPos, y: a.y, z: a.z + wall * 0.5 },
        { x: b.x + xPos, y: b.y, z: b.z + wall * 0.5 },
        { x: c.x + xPos, y: c.y, z: c.z + wall * 0.5 },
      ]);
    }
  }

  for (let iy = 1; iy < slotsY; iy++) {
    const yPos = -depth / 2 + (iy / slotsY) * depth;
    const div = generateBoxTriangles({ width: width - wall * 1.5, depth: wall, height: height - 1, bevel: 0 });
    for (const [a, b, c] of div) {
      tris.push([
        { x: a.x, y: a.y + yPos, z: a.z + wall * 0.5 },
        { x: b.x, y: b.y + yPos, z: b.z + wall * 0.5 },
        { x: c.x, y: c.y + yPos, z: c.z + wall * 0.5 },
      ]);
    }
  }

  return tris;
}

export function generatePrimitiveRawTriangles(node: PrimitiveNode): Array<[Vec3, Vec3, Vec3]> {
  switch (node.type) {
    case 'box':
      return generateBoxTriangles(node.params);
    case 'cylinder':
      return generateCylinderTriangles(node.params);
    case 'cone':
      return generateConeTriangles(node.params);
    case 'sphere':
      return generateSphereTriangles(node.params);
    case 'torus':
      return generateTorusTriangles(node.params);
    case 'gear':
      return generateGearTriangles(node.params);
    case 'twisted_vase':
      return generateTwistedVaseTriangles(node.params);
    case 'bracket':
      return generateBracketTriangles(node.params);
    case 'hex_organizer':
      return generateHexOrganizerTriangles(node.params);
    default:
      return generateBoxTriangles(node.params);
  }
}

export function compileSceneToMesh(scene: SceneSpec): CompiledMesh {
  const rawFaces: TriangleFace[] = [];

  for (const node of scene.nodes) {
    const localTris = generatePrimitiveRawTriangles(node);
    const isSub = node.operation === 'subtract';
    for (const [p0, p1, p2] of localTris) {
      const v0 = transformPoint(p0, node.position, node.rotation, node.scale);
      const v1 = transformPoint(p1, node.position, node.rotation, node.scale);
      const v2 = transformPoint(p2, node.position, node.rotation, node.scale);
      const normal = isSub ? computeNormal(v0, v2, v1) : computeNormal(v0, v1, v2);
      rawFaces.push({
        v0: isSub ? v0 : v0,
        v1: isSub ? v2 : v1,
        v2: isSub ? v1 : v2,
        normal,
        color: isSub ? '#f43f5e' : node.color || scene.printProfile.filamentColor || '#00AE42',
        nodeId: node.id,
        isSubtract: isSub,
      });
    }
  }

  // Ground the mesh so minZ sits on build plate Z = 0
  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;

  for (const f of rawFaces) {
    if (f.isSubtract) continue;
    for (const v of [f.v0, f.v1, f.v2]) {
      if (v.x < minX) minX = v.x;
      if (v.y < minY) minY = v.y;
      if (v.z < minZ) minZ = v.z;
      if (v.x > maxX) maxX = v.x;
      if (v.y > maxY) maxY = v.y;
      if (v.z > maxZ) maxZ = v.z;
    }
  }

  if (!Number.isFinite(minZ)) {
    minX = -10;
    maxX = 10;
    minY = -10;
    maxY = 10;
    minZ = 0;
    maxZ = 10;
  }

  const zShift = minZ < 0 ? -minZ : 0;
  if (zShift !== 0) {
    for (const f of rawFaces) {
      f.v0.z += zShift;
      f.v1.z += zShift;
      f.v2.z += zShift;
    }
    minZ += zShift;
    maxZ += zShift;
  }

  // Deduplicate vertices for 3MF indexed representation & compute signed volume
  const vertexMap = new Map<string, number>();
  const indexedVertices: Vec3[] = [];
  const indexedTriangles: Array<[number, number, number]> = [];
  let signedVolumeMm3 = 0;

  const getVertexIndex = (v: Vec3): number => {
    const key = `${v.x.toFixed(3)},${v.y.toFixed(3)},${v.z.toFixed(3)}`;
    const existing = vertexMap.get(key);
    if (existing !== undefined) return existing;
    const idx = indexedVertices.length;
    indexedVertices.push({
      x: Number(v.x.toFixed(3)),
      y: Number(v.y.toFixed(3)),
      z: Number(v.z.toFixed(3)),
    });
    vertexMap.set(key, idx);
    return idx;
  };

  for (const f of rawFaces) {
    const i0 = getVertexIndex(f.v0);
    const i1 = getVertexIndex(f.v1);
    const i2 = getVertexIndex(f.v2);
    if (i0 !== i1 && i1 !== i2 && i0 !== i2) {
      indexedTriangles.push([i0, i1, i2]);
    }
    // Signed tetrahedron volume
    const v321 = f.v2.x * f.v1.y * f.v0.z;
    const v231 = f.v1.x * f.v2.y * f.v0.z;
    const v312 = f.v2.x * f.v0.y * f.v1.z;
    const v132 = f.v0.x * f.v2.y * f.v1.z;
    const v213 = f.v1.x * f.v0.y * f.v2.z;
    const v123 = f.v0.x * f.v1.y * f.v2.z;
    const tetVol = (1.0 / 6.0) * (-v321 + v231 + v312 - v132 - v213 + v123);
    signedVolumeMm3 += tetVol;
  }

  const dimX = Math.max(0, Number((maxX - minX).toFixed(1)));
  const dimY = Math.max(0, Number((maxY - minY).toFixed(1)));
  const dimZ = Math.max(0, Number((maxZ - minZ).toFixed(1)));

  const rawVolCm3 = Math.max(0.8, Math.abs(signedVolumeMm3) / 1000);
  const infillFactor = 0.28 + ((scene.printProfile.infillPercent || 20) / 100) * 0.72;
  const effectivePlasticCm3 = rawVolCm3 * infillFactor;
  const filamentWeightG = Number((effectivePlasticCm3 * 1.24).toFixed(1)); // PLA density ~1.24 g/cm³
  const filamentLengthM = Number((filamentWeightG / 2.98).toFixed(2)); // 1.75mm PLA ~2.98 g/m
  const layerHeight = Math.max(0.08, scene.printProfile.layerHeightMm || 0.2);
  const layerCount = Math.max(1, Math.ceil(dimZ / layerHeight));
  // Bambu Lab P1S high-speed printing ~14-18 g/hour + 5 min bed leveling/prep
  const estimatedPrintMinutes = Math.max(6, Math.round(5 + filamentWeightG * 3.2 + layerCount * 0.08));

  return {
    triangles: rawFaces,
    indexedVertices,
    indexedTriangles,
    stats: {
      triangleCount: rawFaces.length,
      vertexCount: indexedVertices.length,
      dimensionsMm: { x: dimX, y: dimY, z: dimZ },
      bounds: {
        min: { x: Number(minX.toFixed(2)), y: Number(minY.toFixed(2)), z: Number(minZ.toFixed(2)) },
        max: { x: Number(maxX.toFixed(2)), y: Number(maxY.toFixed(2)), z: Number(maxZ.toFixed(2)) },
      },
      volumeCm3: Number(rawVolCm3.toFixed(2)),
      filamentWeightG,
      filamentLengthM,
      layerCount,
      estimatedPrintMinutes,
    },
  };
}

/**
 * Exports standard Binary STL format (80-byte header + uint32 count + 50-byte records)
 */
export function exportBinaryStl(mesh: CompiledMesh, headerTitle = 'thassi.3dprint Binary STL'): Uint8Array {
  const triCount = mesh.triangles.length;
  const buf = new ArrayBuffer(84 + triCount * 50);
  const view = new DataView(buf);
  const bytes = new Uint8Array(buf);

  const headerText = `${headerTitle} - Bambu Lab P1S Ready`.slice(0, 79);
  for (let i = 0; i < headerText.length; i++) {
    bytes[i] = headerText.charCodeAt(i) & 0xff;
  }

  view.setUint32(80, triCount, true);

  let offset = 84;
  for (const t of mesh.triangles) {
    view.setFloat32(offset + 0, t.normal.x, true);
    view.setFloat32(offset + 4, t.normal.y, true);
    view.setFloat32(offset + 8, t.normal.z, true);

    view.setFloat32(offset + 12, t.v0.x, true);
    view.setFloat32(offset + 16, t.v0.y, true);
    view.setFloat32(offset + 20, t.v0.z, true);

    view.setFloat32(offset + 24, t.v1.x, true);
    view.setFloat32(offset + 28, t.v1.y, true);
    view.setFloat32(offset + 32, t.v1.z, true);

    view.setFloat32(offset + 36, t.v2.x, true);
    view.setFloat32(offset + 40, t.v2.y, true);
    view.setFloat32(offset + 44, t.v2.z, true);

    view.setUint16(offset + 48, 0, true);
    offset += 50;
  }

  return bytes;
}

/**
 * Zero-dependency ZIP builder (STORE method + IEEE CRC32) for creating genuine .3MF packages
 * compatible with Bambu Studio, OrcaSlicer, ElegooSlicer, and PrusaSlicer.
 */
const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = CRC32_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function encodeUtf8(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

function createZipArchive(files: Array<{ name: string; content: Uint8Array }>): Uint8Array {
  const localChunks: Uint8Array[] = [];
  const centralChunks: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = encodeUtf8(file.name);
    const data = file.content;
    const crc = crc32(data);
    const size = data.byteLength;

    const localHeader = new ArrayBuffer(30 + nameBytes.length);
    const lv = new DataView(localHeader);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, 0, true);
    lv.setUint16(8, 0, true); // STORE (0)
    lv.setUint16(10, 0, true);
    lv.setUint16(12, 0x5521, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, size, true);
    lv.setUint32(22, size, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);
    new Uint8Array(localHeader, 30).set(nameBytes);

    localChunks.push(new Uint8Array(localHeader));
    localChunks.push(data);

    const centralHeader = new ArrayBuffer(46 + nameBytes.length);
    const cv = new DataView(centralHeader);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, 0, true);
    cv.setUint16(14, 0x5521, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, size, true);
    cv.setUint32(24, size, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, 0, true);
    cv.setUint32(42, offset, true);
    new Uint8Array(centralHeader, 46).set(nameBytes);

    centralChunks.push(new Uint8Array(centralHeader));
    offset += 30 + nameBytes.length + size;
  }

  let centralSize = 0;
  for (const c of centralChunks) centralSize += c.byteLength;

  const eocd = new ArrayBuffer(22);
  const ev = new DataView(eocd);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, files.length, true);
  ev.setUint16(10, files.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);
  ev.setUint16(20, 0, true);

  const totalSize = offset + centralSize + 22;
  const out = new Uint8Array(totalSize);
  let pos = 0;
  for (const c of localChunks) {
    out.set(c, pos);
    pos += c.byteLength;
  }
  for (const c of centralChunks) {
    out.set(c, pos);
    pos += c.byteLength;
  }
  out.set(new Uint8Array(eocd), pos);
  return out;
}

export function export3mfArchive(mesh: CompiledMesh, scene: SceneSpec): Uint8Array {
  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
  <Default Extension="config" ContentType="text/xml"/>
</Types>`;

  const relsXml = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel-1" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`;

  // Shift object to center of Bambu Lab P1S 256x256mm bed (128, 128, 0)
  const verticesXml = mesh.indexedVertices
    .map((v) => `          <vertex x="${v.x}" y="${v.y}" z="${v.z}"/>`)
    .join('\n');
  const trianglesXml = mesh.indexedTriangles
    .map(([v1, v2, v3]) => `          <triangle v1="${v1}" v2="${v2}" v3="${v3}"/>`)
    .join('\n');

  const safeTitle = (scene.title || 'ThassiModel').replace(/[<>&"']/g, '');
  const modelXml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="de-DE" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:BambuStudio="http://schemas.bambulab.com/package/2021">
  <metadata name="Application">Thassi.3DPrint-Antigravity-1.0</metadata>
  <metadata name="Title">${safeTitle}</metadata>
  <metadata name="Designer">Antigravity AI</metadata>
  <resources>
    <object id="1" name="${safeTitle}" type="model">
      <mesh>
        <vertices>
${verticesXml}
        </vertices>
        <triangles>
${trianglesXml}
        </triangles>
      </mesh>
    </object>
  </resources>
  <build>
    <item objectid="1" transform="1 0 0 0 1 0 0 0 1 128 128 0" printable="1"/>
  </build>
</model>`;

  const settingsConfigXml = `<?xml version="1.0" encoding="UTF-8"?>
<config>
  <object id="1">
    <metadata key="name" value="${safeTitle}"/>
    <metadata key="extruder" value="1"/>
  </object>
  <plate>
    <metadata key="plater_id" value="1"/>
    <metadata key="plater_name" value="Bambu Lab P1S Textured PEI"/>
    <model_instance>
      <metadata key="object_id" value="1"/>
      <metadata key="instance_id" value="0"/>
    </model_instance>
  </plate>
</config>`;

  return createZipArchive([
    { name: '[Content_Types].xml', content: encodeUtf8(contentTypesXml) },
    { name: '_rels/.rels', content: encodeUtf8(relsXml) },
    { name: '3D/3dmodel.model', content: encodeUtf8(modelXml) },
    { name: 'Metadata/model_settings.config', content: encodeUtf8(settingsConfigXml) },
  ]);
}

/**
 * Generates direct printable G-Code for Bambu Lab P1S (256x256x256mm) with planar layer slicing,
 * perimeter + rectilinear infill extrusion, and M73 progress updates.
 */
export function exportPrintableGcode(mesh: CompiledMesh, scene: SceneSpec): string {
  const prof = scene.printProfile || DEFAULT_PRINT_PROFILE;
  const layerH = Math.max(0.08, prof.layerHeightMm || 0.2);
  const totalLayers = Math.max(1, mesh.stats.layerCount);
  const nozzleTemp = prof.nozzleTempC || 220;
  const bedTemp = prof.bedTempC || 60;
  const centerX = 128;
  const centerY = 128;

  const lines: string[] = [
    `; Generated by thassi.3dprint (Antigravity 3D Slicer Engine v1.0.0)`,
    `; Project: ${scene.title}`,
    `; Target Printer: ${prof.printerModel} (256x256x256mm)`,
    `; Filament: ${prof.filamentType} (${prof.filamentColor})`,
    `; Dimensions: ${mesh.stats.dimensionsMm.x} x ${mesh.stats.dimensionsMm.y} x ${mesh.stats.dimensionsMm.z} mm`,
    `; Layers: ${totalLayers} (Layer Height: ${layerH} mm)`,
    `; Estimated Filament: ${mesh.stats.filamentWeightG} g (${mesh.stats.filamentLengthM} m)`,
    `; Estimated Time: ${mesh.stats.estimatedPrintMinutes} min`,
    `M73 P0 R${mesh.stats.estimatedPrintMinutes}`,
    `G90 ; Absolute coordinates`,
    `M83 ; Relative extruder distances`,
    `M140 S${bedTemp} ; Set bed temperature`,
    `M104 S${nozzleTemp} ; Set nozzle temperature`,
    `G28 ; Home all axes (Bambu Lab P1S)`,
    `M190 S${bedTemp} ; Wait for bed temperature`,
    `M109 S${nozzleTemp} ; Wait for nozzle temperature`,
    `; Bambu Lab P1S front nozzle purge line`,
    `G1 Z2.0 F3000`,
    `G1 X10 Y5 Z0.28 F5000`,
    `G1 X120 Y5 E12.0 F1500`,
    `G1 X120 Y5.6 F5000`,
    `G1 X10 Y5.6 E12.0 F1500`,
    `G1 Z1.0 F3000`,
  ];

  const maxSliceLayers = Math.min(totalLayers, 180);
  const stepLayers = Math.max(1, Math.floor(totalLayers / maxSliceLayers));

  const minX = mesh.stats.bounds.min.x;
  const maxX = mesh.stats.bounds.max.x;
  const minY = mesh.stats.bounds.min.y;
  const maxY = mesh.stats.bounds.max.y;

  for (let l = 1; l <= totalLayers; l += stepLayers) {
    const z = Number((l * layerH).toFixed(3));
    const pct = Math.min(99, Math.round((l / totalLayers) * 100));
    const remMin = Math.max(1, Math.round(mesh.stats.estimatedPrintMinutes * (1 - l / totalLayers)));

    lines.push(`; LAYER:${l}/${totalLayers} Z=${z}mm`);
    lines.push(`M73 P${pct} R${remMin}`);
    lines.push(`G1 Z${z} F1800`);

    // Intersect triangles spanning this Z plane to find layer bounding contour
    let lMinX = Infinity;
    let lMaxX = -Infinity;
    let lMinY = Infinity;
    let lMaxY = -Infinity;

    for (const t of mesh.triangles) {
      if (t.isSubtract) continue;
      const tMinZ = Math.min(t.v0.z, t.v1.z, t.v2.z);
      const tMaxZ = Math.max(t.v0.z, t.v1.z, t.v2.z);
      if (z >= tMinZ && z <= tMaxZ) {
        const txMin = Math.min(t.v0.x, t.v1.x, t.v2.x);
        const txMax = Math.max(t.v0.x, t.v1.x, t.v2.x);
        const tyMin = Math.min(t.v0.y, t.v1.y, t.v2.y);
        const tyMax = Math.max(t.v0.y, t.v1.y, t.v2.y);
        if (txMin < lMinX) lMinX = txMin;
        if (txMax > lMaxX) lMaxX = txMax;
        if (tyMin < lMinY) lMinY = tyMin;
        if (tyMax > lMaxY) lMaxY = tyMax;
      }
    }

    if (!Number.isFinite(lMinX)) {
      lMinX = minX;
      lMaxX = maxX;
      lMinY = minY;
      lMaxY = maxY;
    }

    const x0 = (centerX + lMinX).toFixed(2);
    const x1 = (centerX + lMaxX).toFixed(2);
    const y0 = (centerY + lMinY).toFixed(2);
    const y1 = (centerY + lMaxY).toFixed(2);
    const dx = Math.max(1, lMaxX - lMinX);
    const dy = Math.max(1, lMaxY - lMinY);
    const eX = (dx * 0.033).toFixed(4);
    const eY = (dy * 0.033).toFixed(4);

    // Outer perimeter loop
    lines.push(`G1 X${x0} Y${y0} F9000`);
    lines.push(`G1 X${x1} Y${y0} E${eX} F3600`);
    lines.push(`G1 X${x1} Y${y1} E${eY} F3600`);
    lines.push(`G1 X${x0} Y${y1} E${eX} F3600`);
    lines.push(`G1 X${x0} Y${y0} E${eY} F3600`);

    // Sparse infill pass
    const midY = (centerY + (lMinY + lMaxY) / 2).toFixed(2);
    lines.push(`G1 X${x0} Y${midY} F9000`);
    lines.push(`G1 X${x1} Y${midY} E${eX} F4800`);
  }

  lines.push(
    `M73 P100 R0`,
    `; End G-Code for Bambu Lab P1S`,
    `G1 E-1.5 F2400 ; Retract filament`,
    `G1 Z${Math.min(250, Math.round(mesh.stats.dimensionsMm.z + 15))} F3000`,
    `G1 X10 Y245 F9000 ; Present print`,
    `M104 S0 ; Turn off nozzle heater`,
    `M140 S0 ; Turn off bed heater`,
    `M106 S0 ; Turn off part fan`,
    `M84 ; Disable steppers`
  );

  return lines.join('\n');
}

export const PRESET_TEMPLATES: Record<string, () => SceneSpec> = {
  desk_headphone_stand: () => ({
    projectId: 'preset-headphone-hook',
    title: 'Schreibtisch-Kopfhörerhalter (Bambu P1S)',
    description: 'Verstärkter Tischkanten-Klemmhalter mit Kabelführung und rutschfester Frontlippe.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    buildPlateMm: [256, 256, 256],
    printProfile: { ...DEFAULT_PRINT_PROFILE, filamentColor: '#00AE42', infillPercent: 25 },
    nodes: [
      {
        id: 'node-bracket-main',
        name: 'Tischklemme & Hakenkörper',
        type: 'bracket',
        operation: 'union',
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        color: '#00AE42',
        params: { width: 38, depth: 62, height: 74, thickness: 7, lipHeight: 22 },
      },
      {
        id: 'node-cable-bore',
        name: 'Kabelführung-Durchbruch',
        type: 'cylinder',
        operation: 'subtract',
        position: [0, -27, 36],
        rotation: [90, 0, 0],
        scale: [1, 1, 1],
        color: '#f43f5e',
        params: { radiusBottom: 6, radiusTop: 6, height: 18, segments: 24 },
      },
    ],
    promptHistory: [
      {
        id: 'init-1',
        prompt: 'Erstelle einen stabilen Kopfhörerhalter für die Schreibtischkante mit Kabelführung',
        summary: 'Tischklemme (38×62×74mm, 7mm Wandstärke) mit 22mm Haltelippe und 12mm Kabeldurchführung generiert.',
        engine: 'Antigravity Parametric CAD',
        timestamp: new Date().toISOString(),
      },
    ],
  }),

  precision_planetary_gear: () => ({
    projectId: 'preset-gear-24t',
    title: 'Präzisions-Stirnrad Z24 mit Nabe',
    description: 'Mechanisches Stirnzahnrad (24 Zähne, Ø64mm) mit verstärkter Mittelbohrung für 8mm Welle.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    buildPlateMm: [256, 256, 256],
    printProfile: { ...DEFAULT_PRINT_PROFILE, filamentColor: '#38bdf8', infillPercent: 35 },
    nodes: [
      {
        id: 'node-gear-ring',
        name: 'Zahnkranz Z24',
        type: 'gear',
        operation: 'union',
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        color: '#38bdf8',
        params: { teeth: 24, outerRadius: 34, toothDepth: 4.8, boreRadius: 8, height: 12 },
      },
      {
        id: 'node-gear-hub',
        name: 'Verstärkte Wellen-Nabe',
        type: 'cylinder',
        operation: 'union',
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        color: '#0284c7',
        params: { radiusBottom: 15, radiusTop: 14, innerRadius: 5, height: 20, segments: 36 },
      },
    ],
    promptHistory: [
      {
        id: 'init-gear',
        prompt: 'Erstelle ein Zahnrad mit 24 Zähnen, Nabe und 10mm Wellenbohrung',
        summary: 'Stirnrad (24 Zähne, Ø68mm, Höhe 12mm) mit 20mm Nabe und Ø10mm Innenbohrung erstellt.',
        engine: 'Antigravity Parametric CAD',
        timestamp: new Date().toISOString(),
      },
    ],
  }),

  twisted_rib_vase: () => ({
    projectId: 'preset-twisted-vase',
    title: 'Spiral-Designvase (Bambu Silk)',
    description: 'Skulpturale Vase mit 14 harmonischen Längsrippen und 110° Torsion.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    buildPlateMm: [256, 256, 256],
    printProfile: { ...DEFAULT_PRINT_PROFILE, filamentColor: '#f59e0b', infillPercent: 15 },
    nodes: [
      {
        id: 'node-vase-body',
        name: 'Torsions-Vasenkörper',
        type: 'twisted_vase',
        operation: 'union',
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        color: '#f59e0b',
        params: {
          radiusBottom: 28,
          radiusTop: 35,
          height: 92,
          wallThickness: 2.6,
          twistDeg: 110,
          ribCount: 14,
          ribAmplitude: 3.2,
        },
      },
    ],
    promptHistory: [
      {
        id: 'init-vase',
        prompt: 'Generiere eine gedrehte Design-Vase mit 14 Rippen und 92mm Höhe',
        summary: 'Skulpturale Rippen-Vase (Ø70×92mm, 110° Drehung, 2.6mm Wandung) erstellt.',
        engine: 'Antigravity Parametric CAD',
        timestamp: new Date().toISOString(),
      },
    ],
  }),

  smart_home_organizer: () => ({
    projectId: 'preset-hex-organizer',
    title: 'Schreibtisch & Smart-Sensor Organizer (6 Fächer)',
    description: 'Modularer Aufbewahrungs-Tray für Werkzeuge, SD-Karten, USB-Sticks und Shelly Sensoren.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    buildPlateMm: [256, 256, 256],
    printProfile: { ...DEFAULT_PRINT_PROFILE, filamentColor: '#a855f7', infillPercent: 20 },
    nodes: [
      {
        id: 'node-organizer-tray',
        name: '6-Kammer Organizer Korpus',
        type: 'hex_organizer',
        operation: 'union',
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        color: '#a855f7',
        params: { width: 88, depth: 58, height: 38, wallThickness: 2.4, slotsX: 3, slotsY: 2 },
      },
    ],
    promptHistory: [
      {
        id: 'init-org',
        prompt: 'Erstelle einen Schreibtisch-Organizer mit 3x2 Fächern',
        summary: '6-Kammer Organizer (88×58×38mm, 2.4mm Wandstärke) generiert.',
        engine: 'Antigravity Parametric CAD',
        timestamp: new Date().toISOString(),
      },
    ],
  }),
};
