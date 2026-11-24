import type { Rng } from "./rng.js";
import type { World } from "./types.js";
import { LOCATION_NAMES } from "./locations.js";

const EVENT_LABELS: Record<string, string> = {
  evt_blackout:         "the blackout",
  evt_missing_bell:     "the missing bell",
  evt_stranger_arrives: "the stranger's arrival",
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * One round of gossip. Speakers only share what they knew at the START
 * of the round, so news travels at most one hop per tick.
 */
export function gossipStep(world: World, rng: Rng): string[] {
  const lines: string[] = [];

  // Snapshot: capture each character's state before any gossip happens
  const snapshot = world.characters.map((c) => ({
    id:            c.id,
    name:          c.name,
    location:      c.location,
    memories:      c.memories.map((m) => ({ ...m })),
    gossipy:       c.gossipy,
    relationships: c.relationships,
  }));

  for (const speaker of snapshot) {
    const speakerChar = world.characters.find((c) => c.id === speaker.id)!;

    for (const listenerChar of world.characters) {
      if (listenerChar.id === speaker.id) continue;
      if (listenerChar.location !== speaker.location) continue;

      const trust = speakerChar.relationships[listenerChar.id] ?? 0;
      if (trust <= 0) continue;

      for (const mem of speaker.memories) {
        if (listenerChar.memories.some((x) => x.eventId === mem.eventId)) continue;

        if (rng() < speakerChar.gossipy * trust) {
          const newConfidence = clamp(mem.confidence * 0.9, 0, 1);
          listenerChar.memories.push({
            ...mem,
            tick:       world.tick,
            heardFrom:  speaker.id,
            confidence: newConfidence,
          });

          const eventLabel = EVENT_LABELS[mem.eventId] ?? mem.eventId;
          const locationName = LOCATION_NAMES[speaker.location] ?? speaker.location;
          lines.push(
            `${speaker.name} told ${listenerChar.name} about ${eventLabel} (at the ${locationName})`
          );
        }
      }
    }
  }

  return lines;
}
