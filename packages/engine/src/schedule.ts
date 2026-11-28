import type { CharacterId, LocationId, Phase } from "./types.js";
import { LOCATION_IDS } from "./locations.js";

/**
 * Daily routines. A day is 12 ticks and a night is 12 ticks. Each phase is
 * split evenly across the stops listed for the character, so a villager with
 * three day stops spends four ticks at each one. Routines are purely
 * tick-based (no randomness), so the same seed always gives the same village.
 */
interface Route {
  day: LocationId[];
  night: LocationId[];
}

const PHASE_LENGTH = 12;

const ROUTES: Record<string, Route> = {
  mara:         { day: ["inn", "square", "well"],           night: ["inn", "square"] },
  father_edwin: { day: ["church", "square", "church"],         night: ["inn", "church"] },
  tobias:       { day: ["mill", "inn", "well"],             night: ["square", "mill"] },
  wren:         { day: ["graveyard", "church", "graveyard"],   night: ["church", "church"] },
  odalys:       { day: ["square", "inn", "square"],         night: ["inn", "square"] },
};

/**
 * Returns the location a character should be at for a given phase and tick.
 * Alder patrols all locations in order, cycling every 6 ticks per location.
 */
export function getScheduledLocation(
  characterId: CharacterId,
  phase: Phase,
  tick: number
): LocationId {
  if (characterId === "alder") {
    return LOCATION_IDS[Math.floor(tick / 6) % LOCATION_IDS.length] as LocationId;
  }

  const route = ROUTES[characterId];
  if (!route) return "inn";

  const stops = phase === "day" ? route.day : route.night;
  // Position inside the current phase: 0..11 (tick 0 counts as the start of day 1).
  const cycleTick = tick <= 0 ? 0 : (tick - 1) % (PHASE_LENGTH * 2);
  const inPhase = phase === "day" ? cycleTick : cycleTick - PHASE_LENGTH;
  const clamped = Math.min(Math.max(inPhase, 0), PHASE_LENGTH - 1);
  const slot = Math.min(Math.floor((clamped * stops.length) / PHASE_LENGTH), stops.length - 1);
  return stops[slot] as LocationId;
}
