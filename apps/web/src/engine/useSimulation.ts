import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createWorld,
  mulberry32,
  tick,
} from '@the-underground/engine';
import type { World, EventKind, LocationId, Rng } from '@the-underground/engine';

const BASE_TICK_MS = 1000;

export interface FeedLine {
  id: number;
  tick: number;
  text: string;
  kind: 'gossip' | 'event';
}

const EVENT_TEXT: Record<EventKind, string> = {
  blackout: '🕯 Darkness falls over the whole village.',
  missing_bell: '🔔 The church bell has vanished!',
  stranger_arrives: '🧥 A hooded stranger walks into the square.',
};

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
  // Default seed chosen because news spreads well no matter when an event is
  // triggered (see docs/manual-changes.md). Use ?seed=N to try other villages.
  return 6;
}

const INITIAL_SEED: number = readSeed();
const initialRng: Rng = mulberry32(INITIAL_SEED);
const initialWorld: World = createWorld(INITIAL_SEED);

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useSimulation() {
  // rng and worldRef are mutation targets — never read during render.
  const rng = useRef<Rng>(initialRng);
  const worldRef = useRef<World>(initialWorld);
  const feedId = useRef(0);

  // world is the React-visible snapshot; updated via setWorld after each tick.
  const [world, setWorld] = useState<World>(() => structuredClone(initialWorld));
  const [feed, setFeed] = useState<FeedLine[]>([]);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState<1 | 2>(1);

  const pushFeed = useCallback((lines: Omit<FeedLine, 'id'>[]) => {
    if (lines.length === 0) return;
    const stamped = lines.map((l) => ({ ...l, id: ++feedId.current }));
    setFeed((prev) => [...prev, ...stamped].slice(-200));
  }, []);

  const advance = useCallback(() => {
    const result = tick(worldRef.current, rng.current);
    setWorld(structuredClone(worldRef.current));
    const at = worldRef.current.tick;
    pushFeed(result.gossipLines.map((text) => ({ tick: at, text, kind: 'gossip' as const })));
  }, [pushFeed]);

  const triggerEvent = useCallback((kind: EventKind, location: LocationId) => {
    worldRef.current.pendingEvent = { kind, location };
    pushFeed([{ tick: worldRef.current.tick + 1, text: EVENT_TEXT[kind], kind: 'event' }]);
    advance();
  }, [advance, pushFeed]);

  const reset = useCallback(() => {
    rng.current = mulberry32(INITIAL_SEED);
    worldRef.current = createWorld(INITIAL_SEED);
    setWorld(structuredClone(worldRef.current));
    setFeed([]);
  }, []);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(advance, BASE_TICK_MS / speed);
    return () => window.clearInterval(id);
  }, [advance, paused, speed]);

  const togglePause = useCallback(() => setPaused((p) => !p), []);
  const toggleSpeed = useCallback(() => setSpeed((s) => (s === 1 ? 2 : 1)), []);

  return { world, feed, paused, speed, triggerEvent, step: advance, reset, togglePause, toggleSpeed };
}
