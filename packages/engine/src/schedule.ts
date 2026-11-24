import type { CharacterId, LocationId, Phase } from "./types.js";
import { LOCATION_IDS } from "./locations.js";

/**
 * Returns the location a character should be at for a given phase and tick.
 * Alder patrols all locations in order, cycling every 6 ticks.
 */
export function getScheduledLocation(
  characterId: CharacterId,
  phase: Phase,
  tick: number
): LocationId {
  switch (characterId) {
    case "mara":         return "inn";
    case "father_edwin": return "church";
    case "tobias":       return "mill";
    case "wren":         return "graveyard";
    case "odalys":       return phase === "day" ? "square" : "inn";
    case "alder":        return LOCATION_IDS[Math.floor(tick / 6) % LOCATION_IDS.length] as LocationId;
    default:             return "inn";
  }
}
