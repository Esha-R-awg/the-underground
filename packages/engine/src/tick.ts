import type { Rng } from "./rng.js";
import type { World, Phase, TickResult } from "./types.js";
import { getScheduledLocation } from "./schedule.js";
import { resolveEvent } from "./events.js";
import { gossipStep } from "./gossip.js";

const CYCLE_LENGTH = 24;
const DAY_LENGTH   = 12;
const MOOD_DRIFT   = 0.05;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function tickToPhase(tick: number): Phase {
  const t = tick % CYCLE_LENGTH;
  // ticks 1–12 in each cycle = day, ticks 13–24 (and 0) = night
  return t >= 1 && t <= DAY_LENGTH ? "day" : "night";
}

export function tick(world: World, rng: Rng): TickResult {
  // 1. Advance tick and phase
  world.tick += 1;
  world.phase = tickToPhase(world.tick);

  // 2. Move characters to their scheduled location
  for (const c of world.characters) {
    c.location = getScheduledLocation(c.id, world.phase, world.tick);
  }

  // 3. Clear blackout if it has expired
  if (world.blackoutActive && world.tick >= world.blackoutClearAt) {
    world.blackoutActive = false;
  }

  // 4. Resolve pending event
  if (world.pendingEvent !== null) {
    resolveEvent(world, world.pendingEvent);
    world.pendingEvent = null;
  }

  // 5. Gossip step
  const gossipLines = gossipStep(world, rng);
  for (const line of gossipLines) {
    world.gossipFeed.push(line);
  }

  // 6. Mood drift toward calm
  for (const c of world.characters) {
    if (c.mood > 0) {
      c.mood = clamp(c.mood - MOOD_DRIFT, 0, 1);
    } else if (c.mood < 0) {
      c.mood = clamp(c.mood + MOOD_DRIFT, -1, 0);
    }
  }

  return { gossipLines };
}
