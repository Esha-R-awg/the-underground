import type { World, QueuedEvent, Memory } from "./types.js";

export const EVENT_IDS = {
  blackout:          "evt_blackout",
  missing_bell:      "evt_missing_bell",
  stranger_arrives:  "evt_stranger_arrives",
} as const;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function resolveEvent(world: World, event: QueuedEvent): void {
  const { kind } = event;

  switch (kind) {
    case "blackout": {
      const eventId = EVENT_IDS.blackout;
      for (const c of world.characters) {
        if (c.memories.some((m) => m.eventId === eventId)) continue;
        const mem: Memory = {
          eventId,
          tick: world.tick,
          heardFrom: "witnessed",
          text: "The whole village was plunged into darkness.",
          confidence: 1,
        };
        c.memories.push(mem);
        c.mood = clamp(c.mood - 0.2, -1, 1);
      }
      world.blackoutActive = true;
      world.blackoutClearAt = world.tick + 3;
      break;
    }

    case "missing_bell": {
      const eventId = EVENT_IDS.missing_bell;
      for (const c of world.characters) {
        if (c.location !== "church") continue;
        if (c.memories.some((m) => m.eventId === eventId)) continue;
        const mem: Memory = {
          eventId,
          tick: world.tick,
          heardFrom: "witnessed",
          text: "The church bell has gone silent — it has vanished.",
          confidence: 1,
        };
        c.memories.push(mem);
        c.mood = clamp(c.mood - 0.3, -1, 1);
      }
      break;
    }

    case "stranger_arrives": {
      const eventId = EVENT_IDS.stranger_arrives;
      for (const c of world.characters) {
        if (c.location !== "square") continue;
        if (c.memories.some((m) => m.eventId === eventId)) continue;
        const mem: Memory = {
          eventId,
          tick: world.tick,
          heardFrom: "witnessed",
          text: "A hooded stranger appeared in the square.",
          confidence: 1,
        };
        c.memories.push(mem);
        // Characters who distrust outsiders (low gossipy) lose more trust
        // toward everyone, representing general unease.
        for (const otherId of Object.keys(c.relationships)) {
          const reduction = 0.2 * (1 - c.gossipy);
          c.relationships[otherId] = clamp(
            (c.relationships[otherId] ?? 0) - reduction,
            -1,
            1
          );
        }
      }
      break;
    }
  }
}
