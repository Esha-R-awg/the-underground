import { useCallback, useEffect, useRef, useState } from 'react';
import type { World } from '@the-underground/engine';
import {
  makeView,
  buildSprites,
  buildBackdrop,
  buildVignette,
  buildFogLayers,
  buildLanterns,
  tickFog,
  tickLanterns,
  targetPositions,
  hitTest,
  diffEffects,
  shakeOffset,
  drawBuildings,
  drawMillBlades,
  drawNightTint,
  drawBlackout,
  drawLanterns,
  drawFog,
  drawCharacters,
  drawEffects,
} from './renderer';
import type {
  View,
  Sprites,
  FogLayer,
  LanternState,
  TrailPoint,
  Effect,
  ShakeState,
} from './renderer';

interface Props {
  world: World;
  selectedId: string | null;
  onSelectCharacter: (id: string | null) => void;
}

interface Layers {
  view: View;
  night: HTMLCanvasElement;
  day: HTMLCanvasElement;
  vignette: HTMLCanvasElement;
  sprites: Sprites;
  fog: FogLayer[];
  lanterns: LanternState[];
}

const LERP_SPEED = 0.07;
const TRAIL_MAX = 12;
const TRAIL_EVERY = 3; // frames between trail points

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function VillageCanvas({ world, selectedId, onSelectCharacter }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [size, setSize] = useState({ w: 800, h: 520, dpr: 1 });

  // Live values read by the animation loop (so it does not restart every tick)
  const worldRef = useRef<World>(world);
  const selectedRef = useRef<string | null>(selectedId);
  const hoveredRef = useRef<string | null>(null);
  const prevWorld = useRef<World | null>(null);
  const layers = useRef<Layers | null>(null);
  const positions = useRef<Record<string, { x: number; y: number }>>({});
  const trails = useRef<Record<string, TrailPoint[]>>({});
  const effects = useRef<Effect[]>([]);
  const shake = useRef<ShakeState | null>(null);
  const dayAmount = useRef(1);
  const frameCount = useRef(0);

  // Keep canvas sized to its container, and sharp on high-DPI screens
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      const w = Math.max(320, Math.floor(rect.width));
      const h = Math.max(240, Math.floor(rect.height));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      setSize((prev) => (prev.w === w && prev.h === h && prev.dpr === dpr ? prev : { w, h, dpr }));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Track the latest props for the animation loop and detect new events
  useEffect(() => {
    worldRef.current = world;
    const fresh = diffEffects(prevWorld.current, world);
    for (const fx of fresh) {
      effects.current.push(fx);
      if (fx.kind === 'bell_echo') shake.current = { frame: 0, duration: 30 };
    }
    prevWorld.current = world;
  }, [world]);

  useEffect(() => {
    selectedRef.current = selectedId;
  }, [selectedId]);

  // Build the static layers whenever the size changes, then run the animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const view = makeView(size.w, size.h, size.dpr);
    canvas.width = Math.round(size.w * size.dpr);
    canvas.height = Math.round(size.h * size.dpr);
    layers.current = {
      view,
      night: buildBackdrop(view, 'night'),
      day: buildBackdrop(view, 'day'),
      vignette: buildVignette(view),
      sprites: buildSprites(view),
      fog: buildFogLayers(view),
      lanterns: buildLanterns(),
    };

    const reduced = prefersReducedMotion();
    let animId = 0;

    const draw = () => {
      const L = layers.current;
      if (!L) return;
      const w = worldRef.current;
      frameCount.current++;
      const fc = frameCount.current;

      // Where everyone should stand, and move them smoothly there
      const targets = targetPositions(view, w.characters);
      const groupSizes: Record<string, number> = {};
      for (const c of w.characters) {
        const t = targets[c.id];
        if (!t) continue;
        groupSizes[c.id] = t.groupSize;
        const cur = positions.current[c.id];
        if (!cur) {
          positions.current[c.id] = { x: t.x, y: t.y };
          trails.current[c.id] = [];
          continue;
        }
        const px = cur.x;
        const py = cur.y;
        cur.x += (t.x - cur.x) * LERP_SPEED;
        cur.y += (t.y - cur.y) * LERP_SPEED;
        if (!reduced && Math.abs(cur.x - px) + Math.abs(cur.y - py) > 0.6 && fc % TRAIL_EVERY === 0) {
          const trail = trails.current[c.id] ?? [];
          trail.unshift({ x: cur.x, y: cur.y, age: 0 });
          if (trail.length > TRAIL_MAX) trail.pop();
          trails.current[c.id] = trail;
        }
      }
      for (const trail of Object.values(trails.current)) {
        for (const pt of trail) pt.age++;
      }

      // Ease between day and night skies
      const dayTarget = w.phase === 'day' ? 1 : 0;
      dayAmount.current += (dayTarget - dayAmount.current) * 0.04;
      const day = dayAmount.current;

      tickFog(L.fog, view, reduced);
      tickLanterns(L.lanterns, reduced);
      for (const fx of effects.current) fx.frame++;
      effects.current = effects.current.filter((fx) => fx.frame < fx.duration);
      if (shake.current) {
        shake.current.frame++;
        if (shake.current.frame >= shake.current.duration) shake.current = null;
      }

      // ── Draw ──
      ctx.setTransform(size.dpr, 0, 0, size.dpr, 0, 0);
      ctx.clearRect(0, 0, size.w, size.h);

      if (day < 0.99) ctx.drawImage(L.night, 0, 0, size.w, size.h);
      if (day > 0.01) {
        ctx.globalAlpha = day;
        ctx.drawImage(L.day, 0, 0, size.w, size.h);
        ctx.globalAlpha = 1;
      }
      drawNightTint(ctx, view, day);
      drawBuildings(ctx, view, L.sprites, shakeOffset(shake.current, reduced));
      drawMillBlades(ctx, view, reduced ? 0.4 : fc * 0.012);

      if (w.blackoutActive) drawBlackout(ctx, view);
      drawLanterns(ctx, view, L.lanterns, w.blackoutActive, day);
      if (!reduced) drawFog(ctx, view, L.fog);

      drawCharacters(
        ctx,
        view,
        w.characters,
        positions.current,
        groupSizes,
        trails.current,
        selectedRef.current,
        hoveredRef.current,
      );
      drawEffects(ctx, view, effects.current, positions.current, reduced);
      ctx.drawImage(L.vignette, 0, 0, size.w, size.h);

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animId);
  }, [size]);

  const toCanvasPoint = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const L = layers.current;
      const pt = toCanvasPoint(e);
      if (!L || !pt) return;
      const hit = hitTest(L.view, positions.current, worldRef.current.characters, pt.x, pt.y);
      onSelectCharacter(hit === selectedRef.current ? null : hit);
    },
    [onSelectCharacter, toCanvasPoint],
  );

  const handleMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const L = layers.current;
      const pt = toCanvasPoint(e);
      if (!L || !pt) return;
      const hit = hitTest(L.view, positions.current, worldRef.current.characters, pt.x, pt.y);
      hoveredRef.current = hit;
      if (canvasRef.current) canvasRef.current.style.cursor = hit ? 'pointer' : 'default';
    },
    [toCanvasPoint],
  );

  const handleLeave = useCallback(() => {
    hoveredRef.current = null;
  }, []);

  return (
    <div ref={wrapRef} className="canvas-fill">
      <canvas
        ref={canvasRef}
        style={{ width: size.w, height: size.h }}
        onClick={handleClick}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
      />
    </div>
  );
}
