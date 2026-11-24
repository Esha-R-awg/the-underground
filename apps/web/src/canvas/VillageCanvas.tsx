import { useEffect, useRef, useCallback } from 'react';
import type { World } from '@the-underground/engine';
import {
  CANVAS_W, CANVAS_H,
  LOCATION_POSITIONS,
  buildMapLayer,
  buildMoonlightLayer,
  buildVignetteLayer,
  buildFogLayers,
  buildLanterns,
  tickFog,
  tickLanterns,
  drawFog,
  drawLanterns,
  drawBlackout,
  drawEventEffects,
  drawChurchShake,
  drawCharacters,
  shouldTriggerBellEffect,
  shouldTriggerStrangerEffect,
} from './renderer';
import type {
  FogLayer,
  LanternState,
  EventEffect,
  ShakeState,
  TrailPoint,
} from './renderer';

interface Props {
  world: World;
  selectedId: string | null;
  onSelectCharacter: (id: string | null) => void;
}

const LERP_SPEED = 0.08;
const TRAIL_MAX  = 5;
const TRAIL_FREQ = 4; // add a trail point every N frames

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function VillageCanvas({ world, selectedId, onSelectCharacter }: Props) {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const visualPos   = useRef<Record<string, { x: number; y: number }>>({});
  const trails      = useRef<Record<string, TrailPoint[]>>({});
  const fogLayers   = useRef<FogLayer[]>([]);
  const lanterns    = useRef<LanternState[]>([]);
  const effects     = useRef<EventEffect[]>([]);
  const shake       = useRef<ShakeState | null>(null);
  const mapLayer    = useRef<HTMLCanvasElement | null>(null);
  const moonLayer   = useRef<HTMLCanvasElement | null>(null);
  const vigLayer    = useRef<HTMLCanvasElement | null>(null);
  const frameCount  = useRef(0);
  const prevWorld   = useRef<World | null>(null);

  // Build offscreen layers once on mount
  useEffect(() => {
    mapLayer.current  = buildMapLayer();
    moonLayer.current = buildMoonlightLayer();
    vigLayer.current  = buildVignetteLayer();
    fogLayers.current = buildFogLayers();
    lanterns.current  = buildLanterns();

    // Initialise visual positions
    for (const c of world.characters) {
      const target = LOCATION_POSITIONS[c.location];
      if (target) {
        const off = charOffset(c.id);
        visualPos.current[c.id] = { x: target.x + off.x, y: target.y + off.y };
        trails.current[c.id]    = [];
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Detect world events to trigger effects
  useEffect(() => {
    if (shouldTriggerBellEffect(world, prevWorld.current)) {
      effects.current.push({ kind: 'bell_echo', startFrame: 0, frame: 0, duration: 50 });
      shake.current = { frame: 0, duration: 30 };
    }
    if (shouldTriggerStrangerEffect(world, prevWorld.current)) {
      effects.current.push({ kind: 'stranger_fade', startFrame: 0, frame: 0, duration: 60 });
    }
    prevWorld.current = world;
  }, [world]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = prefersReducedMotion();
    let animId: number;

    const draw = () => {
      frameCount.current++;
      const fc = frameCount.current;

      // ── 1. Update visual positions (lerp) ──
      for (const c of world.characters) {
        const target = LOCATION_POSITIONS[c.location];
        if (!target) continue;
        const off = charOffset(c.id);
        const tx  = target.x + off.x;
        const ty  = target.y + off.y;
        const cur = visualPos.current[c.id];
        if (!cur) {
          visualPos.current[c.id] = { x: tx, y: ty };
          trails.current[c.id]    = [];
        } else {
          const prevX = cur.x;
          const prevY = cur.y;
          cur.x += (tx - cur.x) * LERP_SPEED;
          cur.y += (ty - cur.y) * LERP_SPEED;

          // Add trail point if character moved significantly
          const moved = Math.abs(cur.x - prevX) + Math.abs(cur.y - prevY);
          if (!reduced && moved > 0.5 && fc % TRAIL_FREQ === 0) {
            const trail = trails.current[c.id] ?? [];
            trail.unshift({ x: cur.x, y: cur.y, age: 0 });
            if (trail.length > TRAIL_MAX) trail.pop();
            trails.current[c.id] = trail;
          }
        }
      }

      // Age trail points
      if (!reduced) {
        for (const trail of Object.values(trails.current)) {
          for (const pt of trail) pt.age++;
        }
      }

      // ── 2. Tick fog and lanterns ──
      tickFog(fogLayers.current, reduced);
      tickLanterns(lanterns.current, reduced);

      // ── 3. Advance effects ──
      for (const fx of effects.current) fx.frame++;
      effects.current = effects.current.filter(fx => fx.frame < fx.duration);
      if (shake.current) {
        shake.current.frame++;
        if (shake.current.frame >= shake.current.duration) shake.current = null;
      }

      // ── 4. Clear ──
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

      // ── 5. Map (static offscreen) with optional church shake ──
      drawChurchShake(ctx, shake.current, reduced, (c) => {
        if (mapLayer.current) c.drawImage(mapLayer.current, 0, 0);
      });

      // ── 6. Moonlight ──
      if (moonLayer.current) ctx.drawImage(moonLayer.current, 0, 0);

      // ── 7. Lanterns (before blackout, after map) ──
      drawLanterns(ctx, lanterns.current, world.blackoutActive);

      // ── 8. Blackout overlay ──
      if (world.blackoutActive) drawBlackout(ctx);

      // ── 9. Fog ──
      if (!reduced) drawFog(ctx, fogLayers.current);

      // ── 10. Characters + trails ──
      drawCharacters(ctx, world.characters, visualPos.current, trails.current, selectedId);

      // ── 11. Event effects ──
      drawEventEffects(ctx, effects.current, reduced);

      // ── 12. Vignette (always on top) ──
      if (vigLayer.current) ctx.drawImage(vigLayer.current, 0, 0);

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animId);
  }, [world, selectedId]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect  = canvas.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    let closest: string | null = null;
    let closestDist = 18;

    for (const c of world.characters) {
      const pos = visualPos.current[c.id];
      if (!pos) continue;
      const dx   = mx - pos.x;
      const dy   = my - (pos.y - 24);
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < closestDist) {
        closestDist = dist;
        closest     = c.id;
      }
    }
    onSelectCharacter(closest === selectedId ? null : closest);
  }, [world.characters, selectedId, onSelectCharacter]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_W}
      height={CANVAS_H}
      style={{ maxWidth: '100%', maxHeight: '100%' }}
      onClick={handleClick}
      title="Click a character to inspect them"
    />
  );
}

// Fixed scatter offsets so characters at the same location don't pile up
const OFFSETS: Record<string, { x: number; y: number }> = {
  mara:         {  x:  0,  y:  0 },
  father_edwin: {  x:  0,  y:  0 },
  tobias:       {  x:  0,  y:  0 },
  wren:         {  x:  0,  y:  0 },
  odalys:       { x: -16,  y: 12 },
  alder:        { x:  16,  y: 12 },
};

function charOffset(id: string): { x: number; y: number } {
  return OFFSETS[id] ?? { x: 0, y: 0 };
}
