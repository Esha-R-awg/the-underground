import { describe, it, expect } from "vitest";
import { createWorld } from "./world.js";
import { tick } from "./tick.js";
import { mulberry32 } from "./rng.js";
import { LOCATION_IDS } from "./locations.js";

describe("tick", () => {
  it("increments tick counter by 1 each call", () => {
    const world = createWorld(1);
    const rng = mulberry32(1);
    tick(world, rng);
    expect(world.tick).toBe(1);
    tick(world, rng);
    expect(world.tick).toBe(2);
  });

  it("phase is day for ticks 1–12 and night for ticks 13–24", () => {
    const world = createWorld(1);
    const rng = mulberry32(1);
    for (let i = 1; i <= 12; i++) {
      tick(world, rng);
      expect(world.phase).toBe("day");
    }
    for (let i = 13; i <= 24; i++) {
      tick(world, rng);
      expect(world.phase).toBe("night");
    }
  });

  it("all characters are at valid locations after every tick", () => {
    const world = createWorld(5);
    const rng = mulberry32(5);
    for (let i = 0; i < 30; i++) {
      tick(world, rng);
      for (const c of world.characters) {
        expect(LOCATION_IDS).toContain(c.location);
      }
    }
  });

  it("mood drifts toward 0 and never exceeds bounds", () => {
    const world = createWorld(7);
    const rng = mulberry32(7);
    // Push all moods to extremes
    for (const c of world.characters) c.mood = -1;
    for (let i = 0; i < 30; i++) {
      tick(world, rng);
      for (const c of world.characters) {
        expect(c.mood).toBeGreaterThanOrEqual(-1);
        expect(c.mood).toBeLessThanOrEqual(1);
      }
    }
    // After enough ticks, moods should have drifted toward 0
    for (const c of world.characters) {
      expect(c.mood).toBeGreaterThan(-1);
    }
  });

  it("odalys is at square during day and inn during night", () => {
    const world = createWorld(1);
    const rng = mulberry32(1);
    // Tick 1–12: day
    for (let i = 0; i < 12; i++) tick(world, rng);
    const odalysDay = world.characters.find((c) => c.id === "odalys")!;
    expect(odalysDay.location).toBe("square");

    // Tick 13: night
    tick(world, rng);
    const odalysNight = world.characters.find((c) => c.id === "odalys")!;
    expect(odalysNight.location).toBe("inn");
  });

  it("clears pendingEvent after resolving it", () => {
    const world = createWorld(1);
    world.pendingEvent = { kind: "blackout", location: "inn" };
    const rng = mulberry32(1);
    tick(world, rng);
    expect(world.pendingEvent).toBeNull();
  });
});
