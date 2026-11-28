import { describe, it, expect } from "vitest";
import { createWorld } from "./world.js";
import { tick } from "./tick.js";
import { mulberry32 } from "./rng.js";
import { getScheduledLocation } from "./schedule.js";
import { LOCATION_IDS } from "./locations.js";

const VILLAGERS = ["mara", "father_edwin", "tobias", "wren", "odalys"];

describe("daily routines", () => {
  it("every villager starts day 1 at their home post", () => {
    const homes: Record<string, string> = {
      mara: "inn", father_edwin: "church", tobias: "mill", wren: "graveyard", odalys: "square",
    };
    for (const id of VILLAGERS) {
      expect(getScheduledLocation(id, "day", 0)).toBe(homes[id]);
    }
  });

  it("every villager visits at least two different places in a day", () => {
    for (const id of VILLAGERS) {
      const seen = new Set<string>();
      for (let t = 1; t <= 12; t++) seen.add(getScheduledLocation(id, "day", t));
      expect(seen.size).toBeGreaterThanOrEqual(2);
    }
  });

  it("always returns a valid location, for any tick and phase", () => {
    for (const id of [...VILLAGERS, "alder"]) {
      for (let t = 0; t < 100; t++) {
        const phase = t >= 1 && t % 24 >= 1 && t % 24 <= 12 ? "day" : "night";
        expect(LOCATION_IDS).toContain(getScheduledLocation(id, phase, t));
      }
    }
  });

  it("is purely tick-based: the same inputs give the same answer", () => {
    expect(getScheduledLocation("mara", "day", 7)).toBe(getScheduledLocation("mara", "day", 7));
  });
});

describe("news spreads through the village", () => {
  function knowers(world: ReturnType<typeof createWorld>, eventId: string): number {
    return world.characters.filter((c) => c.memories.some((m) => m.eventId === eventId)).length;
  }

  it("Missing Bell reaches at least 3 villagers on average within 24 ticks (seeds 1-30)", () => {
    let total = 0;
    for (let seed = 1; seed <= 30; seed++) {
      const world = createWorld(seed);
      const rng = mulberry32(seed);
      world.pendingEvent = { kind: "missing_bell", location: "church" };
      for (let i = 0; i < 24; i++) tick(world, rng);
      total += knowers(world, "evt_missing_bell");
    }
    expect(total / 30).toBeGreaterThanOrEqual(3);
  });

  it("every event has at least one witness at both day and night start times", () => {
    for (const start of [0, 6, 12, 18]) {
      for (const [kind, loc, evtId] of [
        ["missing_bell", "church", "evt_missing_bell"],
        ["stranger_arrives", "square", "evt_stranger_arrives"],
      ] as const) {
        const world = createWorld(1);
        const rng = mulberry32(1);
        for (let i = 0; i < start; i++) tick(world, rng);
        world.pendingEvent = { kind, location: loc };
        tick(world, rng);
        expect(knowers(world, evtId)).toBeGreaterThanOrEqual(1);
      }
    }
  });
});
