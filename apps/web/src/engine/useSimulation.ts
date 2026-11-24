import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createWorld,
  mulberry32,
  tick,
} from '@the-underground/engine';
import type { World, EventKind, LocationId } from '@the-underground/engine';

const TICK_MS = 1000;

function getSeed(): number {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get('seed');
  if (raw !== null) {
    const n = parseInt(raw, 10);
    if (!isNaN(n)) return n;
  }
  return 42;
}

export function useSimulation() {
  const seed = useRef(getSeed());
  const rng = useRef(mulberry32(seed.current));
  const worldRef = useRef<World>(createWorld(seed.current));
  const [world, setWorld] = useState<World>(() => structuredClone(worldRef.current));

  // Advance one tick and push the new snapshot into React state
  const advance = useCallback(() => {
    tick(worldRef.current, rng.current);
    setWorld(structuredClone(worldRef.current));
  }, []);

  // Trigger an event then immediately tick
  const triggerEvent = useCallback((kind: EventKind, location: LocationId) => {
    worldRef.current.pendingEvent = { kind, location };
    advance();
  }, [advance]);

  // Automatic tick loop
  useEffect(() => {
    const id = window.setInterval(advance, TICK_MS);
    return () => window.clearInterval(id);
  }, [advance]);

  return { world, triggerEvent };
}
