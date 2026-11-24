import type { Character, LocationId, World } from '@the-underground/engine';

// ── Layout constants ──────────────────────────────────────────────────────────

export const CANVAS_W = 800;
export const CANVAS_H = 520;

export const LOCATION_POSITIONS: Record<LocationId, { x: number; y: number }> = {
  inn:       { x: 160, y: 120 },
  church:    { x: 400, y:  80 },
  mill:      { x: 640, y: 120 },
  graveyard: { x: 160, y: 380 },
  square:    { x: 400, y: 260 },
  well:      { x: 640, y: 380 },
};

export const LOCATION_LABELS: Record<LocationId, string> = {
  inn:       'Inn',
  church:    'Church',
  mill:      'Mill',
  graveyard: 'Graveyard',
  square:    'Square',
  well:      'Well',
};

export const CHARACTER_COLOURS: Record<string, string> = {
  mara:         '#e8a040',
  father_edwin: '#a0c8e8',
  tobias:       '#c8a0e8',
  wren:         '#a0e8c8',
  odalys:       '#e8c8a0',
  alder:        '#c8e8a0',
};

const BOX_W = 110;
const BOX_H = 54;
const BOX_R = 10;

// ── Offscreen pre-rendered layers ─────────────────────────────────────────────

/** Pre-render the static map (locations, paths) to an offscreen canvas. */
export function buildMapLayer(): HTMLCanvasElement {
  const off = document.createElement('canvas');
  off.width = CANVAS_W;
  off.height = CANVAS_H;
  const ctx = off.getContext('2d')!;

  // Background
  ctx.fillStyle = '#12101e';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Paths
  ctx.strokeStyle = '#2a2040';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 6]);
  const pairs: [LocationId, LocationId][] = [
    ['inn', 'church'], ['church', 'mill'],
    ['inn', 'square'], ['church', 'square'], ['mill', 'square'],
    ['square', 'graveyard'], ['square', 'well'],
    ['graveyard', 'well'],
  ];
  for (const [a, b] of pairs) {
    const pa = LOCATION_POSITIONS[a]!;
    const pb = LOCATION_POSITIONS[b]!;
    ctx.beginPath();
    ctx.moveTo(pa.x, pa.y);
    ctx.lineTo(pb.x, pb.y);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Location boxes
  for (const id of Object.keys(LOCATION_POSITIONS) as LocationId[]) {
    const { x, y } = LOCATION_POSITIONS[id]!;
    const bx = x - BOX_W / 2;
    const by = y - BOX_H / 2;

    ctx.fillStyle = '#1e1630';
    roundRect(ctx, bx, by, BOX_W, BOX_H, BOX_R);
    ctx.fill();

    ctx.strokeStyle = '#3a2d55';
    ctx.lineWidth = 1.5;
    roundRect(ctx, bx, by, BOX_W, BOX_H, BOX_R);
    ctx.stroke();

    ctx.fillStyle = '#b8a4d8';
    ctx.font = '13px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(LOCATION_LABELS[id]!, x, y);
  }

  return off;
}

/** Pre-render the moonlight gradient to an offscreen canvas. */
export function buildMoonlightLayer(): HTMLCanvasElement {
  const off = document.createElement('canvas');
  off.width = CANVAS_W;
  off.height = CANVAS_H;
  const ctx = off.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H * 0.6);
  grad.addColorStop(0,   'rgba(140, 120, 200, 0.10)');
  grad.addColorStop(0.4, 'rgba(100,  80, 160, 0.04)');
  grad.addColorStop(1,   'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  return off;
}

/** Pre-render the vignette to an offscreen canvas. */
export function buildVignetteLayer(): HTMLCanvasElement {
  const off = document.createElement('canvas');
  off.width = CANVAS_W;
  off.height = CANVAS_H;
  const ctx = off.getContext('2d')!;

  const cx = CANVAS_W / 2;
  const cy = CANVAS_H / 2;
  const r  = Math.sqrt(cx * cx + cy * cy);
  const grad = ctx.createRadialGradient(cx, cy, r * 0.35, cx, cy, r);
  grad.addColorStop(0,   'rgba(0,0,0,0)');
  grad.addColorStop(1,   'rgba(0,0,0,0.72)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  return off;
}

// ── Fog ───────────────────────────────────────────────────────────────────────

export interface FogLayer {
  offscreen: HTMLCanvasElement;
  x: number;         // current x offset (scrolls horizontally)
  y: number;
  speed: number;     // px per frame
  alpha: number;
}

export function buildFogLayers(): FogLayer[] {
  return [
    makeFogLayer(0.06, 0.4,  0.5),
    makeFogLayer(0.04, 0.6,  0.35),
    makeFogLayer(0.025, 0.9, 0.25),
  ];
}

function makeFogLayer(speed: number, alpha: number, density: number): FogLayer {
  const off = document.createElement('canvas');
  // Double width so we can scroll and wrap seamlessly
  off.width  = CANVAS_W * 2;
  off.height = CANVAS_H;
  const ctx  = off.getContext('2d')!;

  // Paint randomised fog blobs using ellipses
  const seed = Math.random(); // layout only — not used by engine
  let s = seed;
  const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };

  const count = Math.floor(density * 28);
  for (let i = 0; i < count; i++) {
    const x  = rand() * CANVAS_W * 2;
    const y  = rand() * CANVAS_H;
    const rx = 60 + rand() * 120;
    const ry = 25 + rand() * 50;
    const gr = ctx.createRadialGradient(x, y, 0, x, y, rx);
    gr.addColorStop(0,   `rgba(160,140,200,${0.12 + rand() * 0.1})`);
    gr.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.save();
    ctx.scale(1, ry / rx);
    ctx.beginPath();
    ctx.arc(x, y * (rx / ry), rx, 0, Math.PI * 2);
    ctx.fillStyle = gr;
    ctx.fill();
    ctx.restore();
  }

  return { offscreen: off, x: 0, y: 0, speed, alpha };
}

export function tickFog(layers: FogLayer[], reducedMotion: boolean): void {
  if (reducedMotion) return;
  for (const layer of layers) {
    layer.x -= layer.speed;
    if (layer.x <= -CANVAS_W) layer.x += CANVAS_W;
  }
}

export function drawFog(ctx: CanvasRenderingContext2D, layers: FogLayer[]): void {
  for (const layer of layers) {
    ctx.globalAlpha = layer.alpha;
    // Draw twice to create seamless wrap
    ctx.drawImage(layer.offscreen, layer.x, layer.y);
    ctx.drawImage(layer.offscreen, layer.x + CANVAS_W, layer.y);
    ctx.globalAlpha = 1;
  }
}

// ── Lanterns ──────────────────────────────────────────────────────────────────

export interface LanternState {
  locationId: LocationId;
  phase: number;      // oscillation phase, 0..2π
  phaseSpeed: number;
}

export function buildLanterns(): LanternState[] {
  return (Object.keys(LOCATION_POSITIONS) as LocationId[]).map((id, i) => ({
    locationId: id,
    phase: (i / 6) * Math.PI * 2,
    phaseSpeed: 0.04 + i * 0.005,
  }));
}

export function tickLanterns(lanterns: LanternState[], reducedMotion: boolean): void {
  if (reducedMotion) return;
  for (const l of lanterns) {
    l.phase += l.phaseSpeed;
  }
}

export function drawLanterns(
  ctx: CanvasRenderingContext2D,
  lanterns: LanternState[],
  blackoutActive: boolean,
): void {
  for (const l of lanterns) {
    const pos = LOCATION_POSITIONS[l.locationId]!;
    const flicker  = Math.sin(l.phase) * 0.15 + Math.sin(l.phase * 2.3) * 0.05;
    const baseR    = blackoutActive ? 28 : 55;
    const r        = baseR + flicker * baseR * 0.3;
    const baseAlpha = blackoutActive ? 0.55 : 0.28;
    const alpha    = baseAlpha + flicker * 0.08;

    const grad = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, r);
    grad.addColorStop(0,   `rgba(232,160,64,${alpha})`);
    grad.addColorStop(0.4, `rgba(200,120,40,${alpha * 0.5})`);
    grad.addColorStop(1,   'rgba(0,0,0,0)');

    ctx.beginPath();
    ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
  }
}

// ── Blackout overlay ──────────────────────────────────────────────────────────

export function drawBlackout(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = 'rgba(0,0,0,0.78)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
}

// ── Event effects ─────────────────────────────────────────────────────────────

export interface EventEffect {
  kind: 'bell_echo' | 'stranger_fade';
  startFrame: number;
  frame: number;
  duration: number;    // frames
}

export function drawEventEffects(
  ctx: CanvasRenderingContext2D,
  effects: EventEffect[],
  reducedMotion: boolean,
): void {
  if (reducedMotion) return;
  for (const fx of effects) {
    const t = fx.frame / fx.duration; // 0..1

    if (fx.kind === 'bell_echo') {
      const { x, y } = LOCATION_POSITIONS['church']!;
      const maxR = 90;
      const r    = t * maxR;
      const a    = (1 - t) * 0.6;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(160,180,220,${a})`;
      ctx.lineWidth   = 2.5 * (1 - t * 0.7);
      ctx.stroke();
    }

    if (fx.kind === 'stranger_fade') {
      const { x, y } = LOCATION_POSITIONS['square']!;
      const alpha     = t < 0.5 ? t * 2 : (1 - t) * 2;
      ctx.save();
      ctx.globalAlpha = alpha * 0.65;
      ctx.fillStyle   = '#c8b8e8';
      ctx.beginPath();
      ctx.arc(x, y - 36, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(x - 7, y - 26, 14, 20);
      ctx.restore();
    }
  }
}

// ── Church shake ──────────────────────────────────────────────────────────────

export interface ShakeState {
  frame: number;
  duration: number;
}

export function drawChurchShake(
  ctx: CanvasRenderingContext2D,
  shake: ShakeState | null,
  reducedMotion: boolean,
  drawFn: (ctx: CanvasRenderingContext2D) => void,
): void {
  if (!shake || reducedMotion) {
    drawFn(ctx);
    return;
  }
  const t = shake.frame / shake.duration;
  const amp = (1 - t) * 5;
  const dx  = Math.sin(shake.frame * 1.8) * amp;
  const dy  = Math.sin(shake.frame * 2.3) * amp * 0.5;
  ctx.save();
  ctx.translate(dx, dy);
  drawFn(ctx);
  ctx.restore();
}

// ── Characters ────────────────────────────────────────────────────────────────

export interface TrailPoint {
  x: number;
  y: number;
  age: number; // 0 = newest, higher = older
}

export function drawCharacters(
  ctx: CanvasRenderingContext2D,
  characters: Character[],
  visualPos: Record<string, { x: number; y: number }>,
  trails: Record<string, TrailPoint[]>,
  selectedId: string | null,
): void {
  // Draw trails first (behind characters)
  for (const c of characters) {
    const trail = trails[c.id];
    if (!trail) continue;
    const colour = CHARACTER_COLOURS[c.id] ?? '#ffffff';
    for (const pt of trail) {
      const alpha = Math.max(0, 0.4 - pt.age * 0.09);
      const r     = Math.max(2, 8 - pt.age * 1.5);
      ctx.beginPath();
      ctx.arc(pt.x, pt.y - 24, r, 0, Math.PI * 2);
      ctx.fillStyle = colour.replace(')', `,${alpha})`).replace('rgb', 'rgba').replace('#', 'rgba(').replace(/rgba\(([\da-f]{2})([\da-f]{2})([\da-f]{2}),/, (_m, r, g, b) =>
        `rgba(${parseInt(r,16)},${parseInt(g,16)},${parseInt(b,16)},`);
      // Simpler: just use a hex + alpha approach via globalAlpha
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = colour;
      ctx.fill();
      ctx.restore();
    }
  }

  // Draw characters
  for (const c of characters) {
    const pos = visualPos[c.id];
    if (!pos) continue;
    const colour     = CHARACTER_COLOURS[c.id] ?? '#ffffff';
    const radius     = 10;
    const isSelected = c.id === selectedId;

    if (isSelected) {
      ctx.beginPath();
      ctx.arc(pos.x, pos.y - 24, radius + 4, 0, Math.PI * 2);
      ctx.strokeStyle = colour;
      ctx.lineWidth   = 2;
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(pos.x, pos.y - 24, radius, 0, Math.PI * 2);
    ctx.fillStyle = colour;
    ctx.fill();

    ctx.fillStyle       = isSelected ? '#ffffff' : '#c8c0e0';
    ctx.font            = '11px Georgia, serif';
    ctx.textAlign       = 'center';
    ctx.textBaseline    = 'top';
    ctx.fillText(c.name.split(' ')[0]!, pos.x, pos.y - 24 + radius + 3);
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function drawMap(ctx: CanvasRenderingContext2D, mapLayer: HTMLCanvasElement): void {
  ctx.drawImage(mapLayer, 0, 0);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  w: number, h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y,     x + w, y + r,     r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x,     y + h, x,     y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x,     y,     x + r, y,         r);
  ctx.closePath();
}

// ── World state helpers ───────────────────────────────────────────────────────

export function shouldTriggerBellEffect(world: World, prevWorld: World | null): boolean {
  if (!prevWorld) return false;
  const had = prevWorld.characters.some(c => c.memories.some(m => m.eventId === 'evt_missing_bell'));
  const has  = world.characters.some(c => c.memories.some(m => m.eventId === 'evt_missing_bell'));
  return has && !had;
}

export function shouldTriggerStrangerEffect(world: World, prevWorld: World | null): boolean {
  if (!prevWorld) return false;
  const had = prevWorld.characters.some(c => c.memories.some(m => m.eventId === 'evt_stranger_arrives'));
  const has  = world.characters.some(c => c.memories.some(m => m.eventId === 'evt_stranger_arrives'));
  return has && !had;
}
