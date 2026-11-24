import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createWorld,
  mulberry32,
  tick,
} from '@the-underground/engine';
import type { World, EventKind, LocationId, Rng } from '@the-underground/engine';

const TICK_MS = 1000;

// ── Module-level singleton ────────────────────────────────────────────────────
// Computed once when the module loads, never during render.
// Reading URL params here is safe: the module initialises before any React
// component mounts.

function readSeed(): number {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get('seed');
  if (raw !== null) {
    const n = parseInt(raw, 10);
    if (!isNaN(n)) return n;
  }
  return 42;
}

const INITIAL_SEED: number  = readSeed();
const initialRng: Rng       = mulberry32(INITIAL_SEED);
const initialWorld: World   = createWorld(INITIAL_SEED);

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useSimulation() {
  // rng and worldRef are mutation targets — never read during render.
  // Initial values are plain objects computed above, not `.current` reads.
  const rng      = useRef<Rng>(initialRng);
  const worldRef = useRef<World>(initialWorld);

  // world is the React-visible snapshot; updated via setWorld after each tick.
  const [world, setWorld] = useState<World>(() => structuredClone(initialWorld));

  const advance = useCallback(() => {
    tick(worldRef.current, rng.current);
    setWorld(structuredClone(worldRef.current));
  }, []);

  const triggerEvent = useCallback((kind: EventKind, location: LocationId) => {
    worldRef.current.pendingEvent = { kind, location };
    advance();
  }, [advance]);

  useEffect(() => {
    const id = window.setInterval(advance, TICK_MS);
    return () => window.clearInterval(id);
  }, [advance]);

  return { world, triggerEvent };
}
