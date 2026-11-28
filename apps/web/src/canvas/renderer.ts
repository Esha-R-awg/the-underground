import type { Character, LocationId, World } from '@the-underground/engine';

/**
 * Canvas renderer for The Underground.
 *
 * Everything is drawn in "logical" CSS pixels. A `View` describes the current
 * canvas size, a scale factor for sprites and text, and the device pixel ratio
 * (so the canvas stays sharp on high-DPI screens). Static scenery is
 * pre-rendered to offscreen canvases and only re-built when the size changes.
 */

// ── View ──────────────────────────────────────────────────────────────────────

export interface View {
  w: number;
  h: number;
  s: number; // sprite/text scale, derived from the canvas size
  dpr: number;
}

export function makeView(w: number, h: number, dpr: number): View {
  const s = Math.max(0.55, Math.min(1.5, Math.min(w / 800, h / 520)));
  return { w, h, s, dpr };
}

// ── Layout ────────────────────────────────────────────────────────────────────

const LOCATION_FRACTIONS: Record<LocationId, { x: number; y: number }> = {
  inn:       { x: 0.16, y: 0.30 },
  church:    { x: 0.50, y: 0.20 },
  mill:      { x: 0.84, y: 0.30 },
  graveyard: { x: 0.16, y: 0.74 },
  square:    { x: 0.50, y: 0.54 },
  well:      { x: 0.84, y: 0.74 },
};

export const LOCATION_LABELS: Record<LocationId, string> = {
  inn:       'Inn',
  church:    'Church',
  mill:      'Mill',
  graveyard: 'Graveyard',
  square:    'Square',
  well:      'Well',
};

const LOCATION_IDS = Object.keys(LOCATION_FRACTIONS) as LocationId[];

export function locPos(view: View, id: LocationId): { x: number; y: number } {
  const f = LOCATION_FRACTIONS[id] ?? { x: 0.5, y: 0.5 };
  return { x: f.x * view.w, y: f.y * view.h };
}

export const CHARACTER_COLOURS: Record<string, string> = {
  mara:         '#e8a040',
  father_edwin: '#a0c8e8',
  tobias:       '#c8a0e8',
  wren:         '#a0e8c8',
  odalys:       '#e8c8a0',
  alder:        '#c8e8a0',
};

const CHARACTER_ORDER = ['mara', 'father_edwin', 'tobias', 'wren', 'odalys', 'alder'];

// Sprite size in "units" (multiplied by view.s when drawn)
const SPRITE_W = 120;
const SPRITE_H = 96;
const LABEL_OFFSET = 60; // units below the building centre
const TOKEN_OFFSET = 86; // units below the building centre
const TOKEN_GAP = 30;    // units between characters standing together
const TOKEN_RADIUS = 11;

// Palette for the drawn scenery
const BODY = '#2b2246';
const EDGE = '#5a4a85';
const ROOF = '#1b142f';
const WINDOW = '#f0b050';

// Small deterministic random generator used only for scenery layout
function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeCanvas(wCss: number, hCss: number, dpr: number): {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
} {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(wCss * dpr));
  canvas.height = Math.max(1, Math.round(hCss * dpr));
  const ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);
  return { canvas, ctx };
}

// ── Buildings (drawn in sprite units, 120 x 96) ───────────────────────────────

function fillPoly(
  ctx: CanvasRenderingContext2D,
  pts: [number, number][],
  fill: string,
  stroke: string = EDGE,
): void {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function litWindow(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  ctx.save();
  ctx.shadowColor = 'rgba(240,176,80,0.9)';
  ctx.shadowBlur = 8;
  ctx.fillStyle = WINDOW;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

function drawInn(ctx: CanvasRenderingContext2D): void {
  fillPoly(ctx, [[22, 46], [98, 46], [98, 88], [22, 88]], BODY);
  fillPoly(ctx, [[14, 48], [60, 14], [106, 48]], ROOF);
  fillPoly(ctx, [[80, 22], [90, 22], [90, 40], [80, 40]], ROOF);
  fillPoly(ctx, [[54, 64], [66, 64], [66, 88], [54, 88]], '#150f26');
  litWindow(ctx, 30, 56, 14, 12);
  litWindow(ctx, 76, 56, 14, 12);
  // hanging sign
  ctx.strokeStyle = EDGE;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(98, 54);
  ctx.lineTo(110, 54);
  ctx.stroke();
  ctx.fillStyle = '#3d2f5e';
  ctx.fillRect(104, 55, 10, 8);
}

function drawChurch(ctx: CanvasRenderingContext2D): void {
  fillPoly(ctx, [[28, 54], [92, 54], [92, 88], [28, 88]], BODY);
  fillPoly(ctx, [[48, 32], [72, 32], [72, 56], [48, 56]], BODY);
  fillPoly(ctx, [[44, 34], [60, 10], [76, 34]], ROOF);
  // cross
  ctx.strokeStyle = '#8a79b8';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(60, 10);
  ctx.lineTo(60, 1);
  ctx.moveTo(56, 5);
  ctx.lineTo(64, 5);
  ctx.stroke();
  // bell
  ctx.fillStyle = '#d8c070';
  ctx.beginPath();
  ctx.arc(60, 44, 3.5, 0, Math.PI * 2);
  ctx.fill();
  // arched window
  ctx.save();
  ctx.shadowColor = 'rgba(240,176,80,0.9)';
  ctx.shadowBlur = 8;
  ctx.fillStyle = WINDOW;
  ctx.beginPath();
  ctx.moveTo(55, 80);
  ctx.lineTo(55, 70);
  ctx.arc(60, 70, 5, Math.PI, 0);
  ctx.lineTo(65, 80);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawMill(ctx: CanvasRenderingContext2D): void {
  fillPoly(ctx, [[44, 42], [76, 42], [86, 88], [34, 88]], BODY);
  fillPoly(ctx, [[40, 42], [60, 24], [80, 42]], ROOF);
  fillPoly(ctx, [[54, 70], [66, 70], [66, 88], [54, 88]], '#150f26');
  litWindow(ctx, 56, 54, 8, 10);
}

function drawGraveyard(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#1a1430';
  ctx.beginPath();
  ctx.ellipse(60, 84, 50, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  const stone = (x: number, y: number, w: number, h: number) => {
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x, y + w / 2);
    ctx.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0);
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
    ctx.fillStyle = '#3a3158';
    ctx.fill();
    ctx.strokeStyle = EDGE;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  };
  stone(22, 58, 16, 28);
  stone(50, 48, 18, 38);
  stone(80, 60, 16, 26);
  // cross
  ctx.strokeStyle = '#8a79b8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(59, 56);
  ctx.lineTo(59, 70);
  ctx.moveTo(54, 61);
  ctx.lineTo(64, 61);
  ctx.stroke();
  // bare tree
  ctx.strokeStyle = '#0d0918';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(108, 86);
  ctx.lineTo(106, 50);
  ctx.moveTo(106, 62);
  ctx.lineTo(96, 48);
  ctx.moveTo(106, 56);
  ctx.lineTo(115, 44);
  ctx.stroke();
}

function drawSquare(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#1d1630';
  ctx.strokeStyle = EDGE;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(60, 78, 48, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#6a5a95';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(60, 78);
  ctx.lineTo(60, 34);
  ctx.stroke();
  fillPoly(ctx, [[52, 26], [60, 16], [68, 26]], ROOF);
  litWindow(ctx, 54, 26, 12, 12);
}

function drawWell(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#2f2650';
  ctx.fillRect(40, 58, 40, 26);
  ctx.strokeStyle = EDGE;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(40, 58, 40, 26);
  ctx.fillStyle = '#120d22';
  ctx.beginPath();
  ctx.ellipse(60, 58, 20, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#6a5a95';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(42, 58);
  ctx.lineTo(42, 32);
  ctx.moveTo(78, 58);
  ctx.lineTo(78, 32);
  ctx.stroke();
  fillPoly(ctx, [[34, 34], [60, 16], [86, 34]], ROOF);
  ctx.strokeStyle = '#8a79b8';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(60, 22);
  ctx.lineTo(60, 52);
  ctx.stroke();
  ctx.fillStyle = '#4a3d70';
  ctx.fillRect(56, 50, 8, 6);
}

const SPRITE_DRAWERS: Record<LocationId, (ctx: CanvasRenderingContext2D) => void> = {
  inn: drawInn,
  church: drawChurch,
  mill: drawMill,
  graveyard: drawGraveyard,
  square: drawSquare,
  well: drawWell,
};

export type Sprites = Record<LocationId, HTMLCanvasElement>;

export function buildSprites(view: View): Sprites {
  const out = {} as Sprites;
  const k = view.s;
  for (const id of LOCATION_IDS) {
    const { canvas, ctx } = makeCanvas(SPRITE_W * k, SPRITE_H * k, view.dpr);
    ctx.scale(k, k);
    SPRITE_DRAWERS[id](ctx);
    out[id] = canvas;
  }
  return out;
}

export function drawBuildings(
  ctx: CanvasRenderingContext2D,
  view: View,
  sprites: Sprites,
  shake: { dx: number; dy: number } | null,
): void {
  for (const id of LOCATION_IDS) {
    const { x, y } = locPos(view, id);
    const sx = id === 'church' && shake ? shake.dx : 0;
    const sy = id === 'church' && shake ? shake.dy : 0;
    ctx.drawImage(
      sprites[id],
      x - (SPRITE_W / 2) * view.s + sx,
      y - (SPRITE_H / 2) * view.s + sy,
      SPRITE_W * view.s,
      SPRITE_H * view.s,
    );
  }
}

/** Slowly turning mill blades, drawn every frame so they can move. */
export function drawMillBlades(
  ctx: CanvasRenderingContext2D,
  view: View,
  angle: number,
): void {
  const { x, y } = locPos(view, 'mill');
  const hx = x;
  const hy = y - 6 * view.s;
  const len = 36 * view.s;
  ctx.save();
  ctx.translate(hx, hy);
  ctx.rotate(angle);
  ctx.strokeStyle = '#4a3d70';
  ctx.fillStyle = '#2b2246';
  ctx.lineWidth = 2.5 * view.s;
  for (let i = 0; i < 4; i++) {
    ctx.rotate(Math.PI / 2);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(len, 0);
    ctx.stroke();
    ctx.fillRect(len * 0.35, -5 * view.s, len * 0.6, 5 * view.s);
  }
  ctx.fillStyle = '#8a79b8';
  ctx.beginPath();
  ctx.arc(0, 0, 3 * view.s, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ── Backdrop: sky, hills, trees, ground, paths, labels ───────────────────────

export type SkyMode = 'night' | 'day';

const PATHS: [LocationId, LocationId][] = [
  ['inn', 'church'], ['church', 'mill'],
  ['inn', 'square'], ['church', 'square'], ['mill', 'square'],
  ['square', 'graveyard'], ['square', 'well'],
  ['graveyard', 'well'],
];

function drawTree(
  ctx: CanvasRenderingContext2D,
  rand: () => number,
  x: number, y: number,
  angle: number, len: number, depth: number,
): void {
  if (depth <= 0 || len < 3) return;
  const x2 = x + Math.cos(angle) * len;
  const y2 = y + Math.sin(angle) * len;
  ctx.lineWidth = Math.max(1, depth * 1.3);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  const spread = 0.35 + rand() * 0.35;
  drawTree(ctx, rand, x2, y2, angle - spread, len * (0.68 + rand() * 0.1), depth - 1);
  drawTree(ctx, rand, x2, y2, angle + spread * 0.9, len * (0.68 + rand() * 0.1), depth - 1);
}

export function buildBackdrop(view: View, mode: SkyMode): HTMLCanvasElement {
  const { w, h, s } = view;
  const { canvas, ctx } = makeCanvas(w, h, view.dpr);
  const night = mode === 'night';
  const horizon = h * 0.58;

  // Sky
  const sky = ctx.createLinearGradient(0, 0, 0, horizon + 20);
  if (night) {
    sky.addColorStop(0, '#07050f');
    sky.addColorStop(0.5, '#150f2a');
    sky.addColorStop(1, '#2a1f48');
  } else {
    sky.addColorStop(0, '#2a2350');
    sky.addColorStop(0.5, '#5a4570');
    sky.addColorStop(1, '#b88e90');
  }
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // Stars
  if (night) {
    const rand = seeded(7);
    for (let i = 0; i < 90; i++) {
      const x = rand() * w;
      const y = rand() * horizon * 0.9;
      const r = (0.5 + rand() * 1.1) * s;
      ctx.fillStyle = `rgba(230,225,255,${0.25 + rand() * 0.6})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Moon or pale sun
  const ox = night ? w * 0.85 : w * 0.14;
  const oy = h * 0.12;
  const or = (night ? 24 : 20) * s;
  const glow = ctx.createRadialGradient(ox, oy, or * 0.5, ox, oy, or * 5);
  glow.addColorStop(0, night ? 'rgba(190,180,255,0.35)' : 'rgba(255,200,150,0.35)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(ox - or * 5, oy - or * 5, or * 10, or * 10);
  ctx.fillStyle = night ? '#e9e4ff' : '#f4dcc0';
  ctx.beginPath();
  ctx.arc(ox, oy, or, 0, Math.PI * 2);
  ctx.fill();
  if (night) {
    ctx.fillStyle = 'rgba(120,110,170,0.35)';
    for (const [dx, dy, dr] of [[-7, -4, 5], [6, 5, 4], [3, -9, 3]] as const) {
      ctx.beginPath();
      ctx.arc(ox + dx * s, oy + dy * s, dr * s, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Hills
  const hillColours = night ? ['#150f27', '#0e0a1b'] : ['#2d2349', '#1f1837'];
  for (let layer = 0; layer < 2; layer++) {
    const base = horizon + layer * 16 * s;
    ctx.fillStyle = hillColours[layer] ?? '#0e0a1b';
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w + 8; x += 8) {
      const y = base - (Math.sin(x * 0.011 + layer * 2) * 14 + Math.sin(x * 0.027 + layer) * 8 + 20) * s;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
  }

  // Ground
  const ground = ctx.createLinearGradient(0, horizon, 0, h);
  ground.addColorStop(0, night ? '#0e0a1a' : '#1f1834');
  ground.addColorStop(1, night ? '#07050d' : '#120d22');
  ctx.fillStyle = ground;
  ctx.fillRect(0, horizon + 8 * s, w, h - horizon);

  // Dead trees
  ctx.strokeStyle = night ? '#0a0714' : '#150f26';
  ctx.lineCap = 'round';
  const treeRand = seeded(21);
  drawTree(ctx, treeRand, w * 0.04, horizon + 38 * s, -Math.PI / 2, 52 * s, 6);
  drawTree(ctx, treeRand, w * 0.96, horizon + 40 * s, -Math.PI / 2, 56 * s, 6);
  drawTree(ctx, treeRand, w * 0.33, horizon + 6 * s, -Math.PI / 2, 30 * s, 5);

  // Paths
  ctx.lineCap = 'round';
  PATHS.forEach(([a, b], i) => {
    const pa = locPos(view, a);
    const pb = locPos(view, b);
    const mx = (pa.x + pb.x) / 2;
    const my = (pa.y + pb.y) / 2;
    const nx = -(pb.y - pa.y);
    const ny = pb.x - pa.x;
    const norm = Math.hypot(nx, ny) || 1;
    const bend = (i % 2 === 0 ? 1 : -1) * 14 * s;
    const cx = mx + (nx / norm) * bend;
    const cy = my + (ny / norm) * bend;
    ctx.strokeStyle = night ? 'rgba(36,28,60,0.9)' : 'rgba(60,48,90,0.9)';
    ctx.lineWidth = 14 * s;
    ctx.beginPath();
    ctx.moveTo(pa.x, pa.y);
    ctx.quadraticCurveTo(cx, cy, pb.x, pb.y);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(120,100,170,0.35)';
    ctx.lineWidth = 2 * s;
    ctx.setLineDash([3 * s, 10 * s]);
    ctx.beginPath();
    ctx.moveTo(pa.x, pa.y);
    ctx.quadraticCurveTo(cx, cy, pb.x, pb.y);
    ctx.stroke();
    ctx.setLineDash([]);
  });

  // Location labels
  ctx.font = `600 ${12 * s}px Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const id of LOCATION_IDS) {
    const { x, y } = locPos(view, id);
    const text = LOCATION_LABELS[id].toUpperCase();
    const ly = y + LABEL_OFFSET * s;
    const tw = ctx.measureText(text).width + 18 * s;
    ctx.fillStyle = 'rgba(10,7,22,0.65)';
    roundRect(ctx, x - tw / 2, ly - 9 * s, tw, 18 * s, 9 * s);
    ctx.fill();
    ctx.fillStyle = '#d6cbf2';
    ctx.fillText(text, x, ly + 0.5);
  }

  return canvas;
}

export function buildVignette(view: View): HTMLCanvasElement {
  const { w, h } = view;
  const { canvas, ctx } = makeCanvas(w, h, view.dpr);
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.hypot(cx, cy);
  const grad = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  return canvas;
}

// ── Fog ───────────────────────────────────────────────────────────────────────

export interface FogLayer {
  canvas: HTMLCanvasElement; // half resolution tile, exactly one canvas-width wide
  x: number;
  y: number;
  height: number;
  speed: number; // px per frame
  alpha: number;
}

function makeFogLayer(view: View, speed: number, alpha: number, blobs: number, seed: number): FogLayer {
  const fogH = Math.round(view.h * 0.55);
  const half = 0.5;
  const { canvas, ctx } = makeCanvas(view.w * half, fogH * half, 1);
  const rand = seeded(seed);
  const tileW = view.w * half;
  for (let i = 0; i < blobs; i++) {
    const x = rand() * tileW;
    const y = rand() * fogH * half;
    const rx = (60 + rand() * 110) * half * view.s;
    const ry = (22 + rand() * 40) * half * view.s;
    const a = 0.14 + rand() * 0.1;
    // draw three copies so the tile wraps seamlessly
    for (const ox of [-tileW, 0, tileW]) {
      const g = ctx.createRadialGradient(x + ox, y, 0, x + ox, y, rx);
      g.addColorStop(0, `rgba(170,150,215,${a})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.save();
      ctx.translate(x + ox, y);
      ctx.scale(1, ry / rx);
      ctx.translate(-(x + ox), -y);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x + ox, y, rx, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
  return { canvas, x: 0, y: view.h - fogH, height: fogH, speed, alpha };
}

export function buildFogLayers(view: View): FogLayer[] {
  return [
    makeFogLayer(view, 0.10, 0.55, 9, 1),
    makeFogLayer(view, 0.06, 0.40, 8, 2),
    makeFogLayer(view, 0.035, 0.30, 7, 3),
  ];
}

export function tickFog(layers: FogLayer[], view: View, reducedMotion: boolean): void {
  if (reducedMotion) return;
  for (const l of layers) {
    l.x -= l.speed * view.s;
    if (l.x <= -view.w) l.x += view.w;
  }
}

export function drawFog(ctx: CanvasRenderingContext2D, view: View, layers: FogLayer[]): void {
  for (const l of layers) {
    ctx.globalAlpha = l.alpha;
    ctx.drawImage(l.canvas, l.x, l.y, view.w, l.height);
    ctx.drawImage(l.canvas, l.x + view.w, l.y, view.w, l.height);
  }
  ctx.globalAlpha = 1;
}

// ── Lanterns ──────────────────────────────────────────────────────────────────

export interface LanternState {
  locationId: LocationId;
  phase: number;
  phaseSpeed: number;
}

export function buildLanterns(): LanternState[] {
  return LOCATION_IDS.map((id, i) => ({
    locationId: id,
    phase: (i / 6) * Math.PI * 2,
    phaseSpeed: 0.04 + i * 0.005,
  }));
}

export function tickLanterns(lanterns: LanternState[], reducedMotion: boolean): void {
  if (reducedMotion) return;
  for (const l of lanterns) l.phase += l.phaseSpeed;
}

export function drawLanterns(
  ctx: CanvasRenderingContext2D,
  view: View,
  lanterns: LanternState[],
  blackoutActive: boolean,
  dayAmount: number,
): void {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const l of lanterns) {
    const pos = locPos(view, l.locationId);
    const flicker = Math.sin(l.phase) * 0.15 + Math.sin(l.phase * 2.3) * 0.05;
    const baseR = (blackoutActive ? 34 : 64) * view.s;
    const r = baseR + flicker * baseR * 0.3;
    const strength = blackoutActive ? 0.6 : 0.3 * (1 - dayAmount * 0.6);
    const alpha = strength + flicker * 0.08;
    const cy = pos.y + 4 * view.s;
    const grad = ctx.createRadialGradient(pos.x, cy, 0, pos.x, cy, r);
    grad.addColorStop(0, `rgba(240,170,70,${alpha})`);
    grad.addColorStop(0.45, `rgba(200,120,40,${alpha * 0.45})`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(pos.x, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawBlackout(ctx: CanvasRenderingContext2D, view: View): void {
  ctx.fillStyle = 'rgba(0,0,0,0.8)';
  ctx.fillRect(0, 0, view.w, view.h);
}

export function drawNightTint(
  ctx: CanvasRenderingContext2D,
  view: View,
  dayAmount: number,
): void {
  const a = 0.28 * (1 - dayAmount);
  if (a < 0.01) return;
  ctx.fillStyle = `rgba(8,6,40,${a})`;
  ctx.fillRect(0, 0, view.w, view.h);
}

// ── Characters ────────────────────────────────────────────────────────────────

export interface TrailPoint {
  x: number;
  y: number;
  age: number;
}

export function groupByLocation(characters: Character[]): Record<string, Character[]> {
  const groups: Record<string, Character[]> = {};
  for (const c of characters) {
    (groups[c.location] ??= []).push(c);
  }
  for (const list of Object.values(groups)) {
    list.sort(
      (a, b) =>
        (CHARACTER_ORDER.indexOf(a.id) + 99) % 99 - (CHARACTER_ORDER.indexOf(b.id) + 99) % 99,
    );
  }
  return groups;
}

/** Where each character should stand: a tidy row below their building. */
export function targetPositions(
  view: View,
  characters: Character[],
): Record<string, { x: number; y: number; groupSize: number }> {
  const out: Record<string, { x: number; y: number; groupSize: number }> = {};
  const groups = groupByLocation(characters);
  for (const [loc, list] of Object.entries(groups)) {
    const base = locPos(view, loc as LocationId);
    list.forEach((c, i) => {
      out[c.id] = {
        x: base.x + (i - (list.length - 1) / 2) * TOKEN_GAP * view.s,
        y: base.y + TOKEN_OFFSET * view.s,
        groupSize: list.length,
      };
    });
  }
  return out;
}

export function hitTest(
  view: View,
  positions: Record<string, { x: number; y: number }>,
  characters: Character[],
  mx: number,
  my: number,
): string | null {
  let best: string | null = null;
  let bestDist = (TOKEN_RADIUS + 6) * view.s;
  for (const c of characters) {
    const p = positions[c.id];
    if (!p) continue;
    const d = Math.hypot(mx - p.x, my - p.y);
    if (d < bestDist) {
      bestDist = d;
      best = c.id;
    }
  }
  return best;
}

export function drawCharacters(
  ctx: CanvasRenderingContext2D,
  view: View,
  characters: Character[],
  positions: Record<string, { x: number; y: number }>,
  groupSizes: Record<string, number>,
  trails: Record<string, TrailPoint[]>,
  selectedId: string | null,
  hoveredId: string | null,
): void {
  const r = TOKEN_RADIUS * view.s;

  // Trails first (behind the characters)
  for (const c of characters) {
    const trail = trails[c.id];
    if (!trail) continue;
    const colour = CHARACTER_COLOURS[c.id] ?? '#ffffff';
    for (const pt of trail) {
      const alpha = Math.max(0, 0.28 - pt.age * 0.018);
      if (alpha <= 0) continue;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = colour;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, Math.max(1.5, r * 0.42 - pt.age * 0.08), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  for (const c of characters) {
    const p = positions[c.id];
    if (!p) continue;
    const colour = CHARACTER_COLOURS[c.id] ?? '#ffffff';
    const isSelected = c.id === selectedId;
    const isHovered = c.id === hoveredId;

    // Soft aura
    const aura = ctx.createRadialGradient(p.x, p.y, r * 0.4, p.x, p.y, r * 2.4);
    aura.addColorStop(0, colour + '55');
    aura.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r * 2.4, 0, Math.PI * 2);
    ctx.fill();

    // Mood ring
    if (c.mood < -0.1) {
      ctx.strokeStyle = c.mood < -0.25 ? '#e07a7a' : '#d8b070';
      ctx.lineWidth = 2.5 * view.s;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r + 3.5 * view.s, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Selection ring
    if (isSelected) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5 * view.s;
      ctx.setLineDash([4 * view.s, 3 * view.s]);
      ctx.beginPath();
      ctx.arc(p.x, p.y, r + 8 * view.s, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Token
    ctx.fillStyle = colour;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0b0716';
    ctx.lineWidth = 2 * view.s;
    ctx.stroke();

    // Initial
    ctx.fillStyle = '#150f26';
    ctx.font = `700 ${12 * view.s}px Georgia, serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(c.name.charAt(0), p.x, p.y + 0.5);

    // Memory badge
    if (c.memories.length > 0) {
      const bx = p.x + r * 0.95;
      const by = p.y - r * 0.95;
      ctx.fillStyle = '#f2c46d';
      ctx.beginPath();
      ctx.arc(bx, by, 6.5 * view.s, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0b0716';
      ctx.lineWidth = 1.5 * view.s;
      ctx.stroke();
      ctx.fillStyle = '#2a1b05';
      ctx.font = `700 ${9 * view.s}px Georgia, serif`;
      ctx.fillText(String(c.memories.length), bx, by + 0.5);
    }

    // Name label: always when few characters share a place, otherwise on hover/selection
    const showName = isSelected || isHovered || (groupSizes[c.id] ?? 1) <= 2;
    if (showName) {
      const label = c.name.split(' ').pop() ?? c.name;
      ctx.font = `${11 * view.s}px Georgia, serif`;
      const tw = ctx.measureText(label).width + 10 * view.s;
      const ly = p.y + r + 11 * view.s;
      ctx.fillStyle = 'rgba(10,7,22,0.7)';
      roundRect(ctx, p.x - tw / 2, ly - 8 * view.s, tw, 16 * view.s, 8 * view.s);
      ctx.fill();
      ctx.fillStyle = isSelected ? '#ffffff' : '#d6cbf2';
      ctx.fillText(label, p.x, ly + 0.5);
    }
  }
}

// ── Effects ───────────────────────────────────────────────────────────────────

export interface Effect {
  kind: 'bell_echo' | 'stranger_fade' | 'ping';
  frame: number;
  duration: number;
  targetId?: string;
  colour?: string;
  emoji?: string;
}

export interface ShakeState {
  frame: number;
  duration: number;
}

export function shakeOffset(shake: ShakeState | null, reducedMotion: boolean): { dx: number; dy: number } | null {
  if (!shake || reducedMotion) return null;
  const t = shake.frame / shake.duration;
  const amp = (1 - t) * 5;
  return {
    dx: Math.sin(shake.frame * 1.8) * amp,
    dy: Math.sin(shake.frame * 2.3) * amp * 0.5,
  };
}

const EVENT_EMOJI: Record<string, string> = {
  evt_blackout: '🕯',
  evt_missing_bell: '🔔',
  evt_stranger_arrives: '🧥',
};

/**
 * Compare two world snapshots and describe what newly happened, so the canvas
 * can show who just witnessed or heard about an event.
 */
export function diffEffects(prev: World | null, next: World): Effect[] {
  if (!prev) return [];
  const effects: Effect[] = [];
  for (const c of next.characters) {
    const before = prev.characters.find((x) => x.id === c.id);
    if (!before) continue;
    for (const m of c.memories) {
      if (before.memories.some((o) => o.eventId === m.eventId)) continue;
      const witnessed = m.heardFrom === 'witnessed';
      const emoji = EVENT_EMOJI[m.eventId];
      effects.push({
        kind: 'ping',
        frame: 0,
        duration: 90,
        targetId: c.id,
        colour: witnessed ? '#f2c46d' : '#8ec8ff',
        ...(emoji ? { emoji } : {}),
      });
    }
  }
  const everKnew = (w: World, id: string) =>
    w.characters.some((c) => c.memories.some((m) => m.eventId === id));
  if (everKnew(next, 'evt_missing_bell') && !everKnew(prev, 'evt_missing_bell')) {
    effects.push({ kind: 'bell_echo', frame: 0, duration: 50 });
  }
  if (everKnew(next, 'evt_stranger_arrives') && !everKnew(prev, 'evt_stranger_arrives')) {
    effects.push({ kind: 'stranger_fade', frame: 0, duration: 70 });
  }
  return effects;
}

export function drawEffects(
  ctx: CanvasRenderingContext2D,
  view: View,
  effects: Effect[],
  positions: Record<string, { x: number; y: number }>,
  reducedMotion: boolean,
): void {
  if (reducedMotion) return;
  for (const fx of effects) {
    const t = fx.frame / fx.duration;

    if (fx.kind === 'bell_echo') {
      const { x, y } = locPos(view, 'church');
      ctx.beginPath();
      ctx.arc(x, y, t * 100 * view.s, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(160,180,220,${(1 - t) * 0.7})`;
      ctx.lineWidth = 2.5 * view.s * (1 - t * 0.7);
      ctx.stroke();
    }

    if (fx.kind === 'stranger_fade') {
      const { x, y } = locPos(view, 'square');
      const alpha = t < 0.5 ? t * 2 : (1 - t) * 2;
      const s = view.s;
      ctx.save();
      ctx.globalAlpha = alpha * 0.7;
      ctx.fillStyle = '#c8b8e8';
      ctx.beginPath();
      ctx.arc(x, y - 44 * s, 8 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x - 9 * s, y - 34 * s);
      ctx.lineTo(x + 9 * s, y - 34 * s);
      ctx.lineTo(x + 13 * s, y - 6 * s);
      ctx.lineTo(x - 13 * s, y - 6 * s);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    if (fx.kind === 'ping' && fx.targetId) {
      const p = positions[fx.targetId];
      if (!p) continue;
      const colour = fx.colour ?? '#ffffff';
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - t);
      ctx.strokeStyle = colour;
      ctx.lineWidth = 2.5 * view.s;
      ctx.beginPath();
      ctx.arc(p.x, p.y, (14 + t * 30) * view.s, 0, Math.PI * 2);
      ctx.stroke();
      if (fx.emoji) {
        ctx.globalAlpha = Math.max(0, 1 - t * 0.8);
        ctx.font = `${17 * view.s}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(fx.emoji, p.x, p.y - (22 + t * 30) * view.s);
      }
      ctx.restore();
    }
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  w: number, h: number,
  r: number,
): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.arcTo(x + w, y, x + w, y + rr, rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.arcTo(x + w, y + h, x + w - rr, y + h, rr);
  ctx.lineTo(x + rr, y + h);
  ctx.arcTo(x, y + h, x, y + h - rr, rr);
  ctx.lineTo(x, y + rr);
  ctx.arcTo(x, y, x + rr, y, rr);
  ctx.closePath();
}
