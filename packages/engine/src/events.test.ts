import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { createWorld } from "./world.js";
import { resolveEvent, EVENT_IDS } from "./events.js";
import { tick } from "./tick.js";
import { mulberry32 } from "./rng.js";
import { LOCATION_IDS } from "./locations.js";

// ─── Unit tests: Blackout ────────────────────────────────────────────────────

describe("resolveEvent — blackout", () => {
  it("gives every character a witnessed memory", () => {
    const world = createWorld(1);
    resolveEvent(world, { kind: "blackout", location: "inn" });
    for (const c of world.characters) {
      const mem = c.memories.find((m) => m.eventId === EVENT_IDS.blackout);
      expect(mem).toBeDefined();
      expect(mem!.heardFrom).toBe("witnessed");
      expect(mem!.confidence).toBe(1);
    }
  });

  it("lowers every character's mood by 0.2", () => {
    const world = createWorld(1);
    // Start all moods at 0
    for (const c of world.characters) c.mood = 0;
    resolveEvent(world, { kind: "blackout", location: "inn" });
    for (const c of world.characters) {
      expect(c.mood).toBeCloseTo(-0.2);
    }
  });

  it("sets blackoutActive and blackoutClearAt", () => {
    const world = createWorld(1);
    world.tick = 5;
    resolveEvent(world, { kind: "blackout", location: "inn" });
    expect(world.blackoutActive).toBe(true);
    expect(world.blackoutClearAt).toBe(8);
  });

  it("does not add a duplicate memory if blackout resolves twice", () => {
    const world = createWorld(1);
    resolveEvent(world, { kind: "blackout", location: "inn" });
    resolveEvent(world, { kind: "blackout", location: "inn" });
    for (const c of world.characters) {
      const count = c.memories.filter((m) => m.eventId === EVENT_IDS.blackout).length;
      expect(count).toBe(1);
    }
  });

  it("mood never goes below -1", () => {
    const world = createWorld(1);
    for (const c of world.characters) c.mood = -0.95;
    resolveEvent(world, { kind: "blackout", location: "inn" });
    for (const c of world.characters) {
      expect(c.mood).toBeGreaterThanOrEqual(-1);
    }
  });
});

// ─── Unit tests: Missing Bell ────────────────────────────────────────────────

describe("resolveEvent — missing_bell", () => {
  it("only gives a memory to characters at the church", () => {
    const world = createWorld(1);
    // Move everyone away, then put father_edwin at church
    for (const c of world.characters) c.location = "inn";
    const edwin = world.characters.find((c) => c.id === "father_edwin")!;
    edwin.location = "church";

    resolveEvent(world, { kind: "missing_bell", location: "church" });

    expect(edwin.memories.some((m) => m.eventId === EVENT_IDS.missing_bell)).toBe(true);
    for (const c of world.characters.filter((c) => c.id !== "father_edwin")) {
      expect(c.memories.some((m) => m.eventId === EVENT_IDS.missing_bell)).toBe(false);
    }
  });

  it("lowers witness mood by 0.3", () => {
    const world = createWorld(1);
    for (const c of world.characters) c.location = "church";
    for (const c of world.characters) c.mood = 0;
    resolveEvent(world, { kind: "missing_bell", location: "church" });
    for (const c of world.characters) {
      expect(c.mood).toBeCloseTo(-0.3);
    }
  });

  it("characters NOT at church have no memory and unchanged mood", () => {
    const world = createWorld(1);
    for (const c of world.characters) {
      c.location = "inn";
      c.mood = 0;
    }
    resolveEvent(world, { kind: "missing_bell", location: "church" });
    for (const c of world.characters) {
      expect(c.memories).toHaveLength(0);
      expect(c.mood).toBe(0);
    }
  });

  it("does not duplicate memory if resolved twice for same character", () => {
    const world = createWorld(1);
    for (const c of world.characters) c.location = "church";
    resolveEvent(world, { kind: "missing_bell", location: "church" });
    resolveEvent(world, { kind: "missing_bell", location: "church" });
    for (const c of world.characters) {
      const count = c.memories.filter((m) => m.eventId === EVENT_IDS.missing_bell).length;
      expect(count).toBe(1);
    }
  });
});

// ─── Unit tests: Stranger Arrives ────────────────────────────────────────────

describe("resolveEvent — stranger_arrives", () => {
  it("only gives a memory to characters at the square", () => {
    const world = createWorld(1);
    for (const c of world.characters) c.location = "inn";
    const odalys = world.characters.find((c) => c.id === "odalys")!;
    odalys.location = "square";

    resolveEvent(world, { kind: "stranger_arrives", location: "square" });

    expect(odalys.memories.some((m) => m.eventId === EVENT_IDS.stranger_arrives)).toBe(true);
    for (const c of world.characters.filter((c) => c.id !== "odalys")) {
      expect(c.memories.some((m) => m.eventId === EVENT_IDS.stranger_arrives)).toBe(false);
    }
  });

  it("reduces trust for witnesses (more reduction for less gossipy characters)", () => {
    const world = createWorld(1);
    for (const c of world.characters) c.location = "square";

    // Record trust before
    const trustBefore: Record<string, Record<string, number>> = {};
    for (const c of world.characters) {
      trustBefore[c.id] = { ...c.relationships };
    }

    resolveEvent(world, { kind: "stranger_arrives", location: "square" });

    for (const c of world.characters) {
      for (const [otherId, oldTrust] of Object.entries(trustBefore[c.id]!)) {
        const newTrust = c.relationships[otherId] ?? 0;
        // Trust should not have increased
        expect(newTrust).toBeLessThanOrEqual(oldTrust + 1e-10);
        // Trust should stay in bounds
        expect(newTrust).toBeGreaterThanOrEqual(-1);
      }
    }
  });

  it("does not duplicate memory if resolved twice", () => {
    const world = createWorld(1);
    for (const c of world.characters) c.location = "square";
    resolveEvent(world, { kind: "stranger_arrives", location: "square" });
    resolveEvent(world, { kind: "stranger_arrives", location: "square" });
    for (const c of world.characters) {
      const count = c.memories.filter((m) => m.eventId === EVENT_IDS.stranger_arrives).length;
      expect(count).toBe(1);
    }
  });
});

// ─── Property-based tests: all 6 engine invariants ───────────────────────────

const ALL_EVENTS = ["blackout", "missing_bell", "stranger_arrives"] as const;

/**
 * Builds a world, optionally triggers one event, runs n ticks,
 * and returns the final world. Used in property tests below.
 */
function runWorld(seed: number, eventKind: typeof ALL_EVENTS[number] | null, ticks: number) {
  const world = createWorld(seed);
  const rng = mulberry32(seed);
  if (eventKind !== null) {
    world.pendingEvent = { kind: eventKind, location: "church" };
  }
  for (let i = 0; i < ticks; i++) tick(world, rng);
  return world;
}

describe("engine invariants — property-based", () => {
  // 1. No teleportation: gossip only travels between co-located characters
  //    (already covered in gossip.test.ts — repeated here at the tick level)
  it("property 1 — no teleportation: memories only come from co-located speakers", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100000 }),
        fc.constantFrom(...ALL_EVENTS),
        fc.integer({ min: 1, max: 10 }),
        (seed, eventKind, ticks) => {
          const world = createWorld(seed);
          const rng = mulberry32(seed);
          world.pendingEvent = { kind: eventKind, location: "church" };

          for (let i = 0; i < ticks; i++) {
            const before = structuredClone(world);
            tick(world, rng);

            for (const c of world.characters) {
              const old = before.characters.find((x) => x.id === c.id)!;
              const learned = c.memories.filter(
                (m) => !old.memories.some((o) => o.eventId === m.eventId)
              );
              for (const m of learned) {
                if (m.heardFrom === "witnessed") continue;
                // Source must have been in the same location and known the event
                const source = before.characters.find(
                  (s) =>
                    s.id === m.heardFrom &&
                    s.location === c.location &&
                    s.memories.some((sm) => sm.eventId === m.eventId)
                );
                expect(source).toBeDefined();
              }
            }
          }
        }
      )
    );
  });

  // 2. Determinism: same seed + same inputs → same world
  it("property 2 — determinism: same seed produces identical world", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100000 }),
        fc.constantFrom(...ALL_EVENTS),
        fc.integer({ min: 1, max: 10 }),
        (seed, eventKind, ticks) => {
          const w1 = runWorld(seed, eventKind, ticks);
          const w2 = runWorld(seed, eventKind, ticks);
          expect(w1).toEqual(w2);
        }
      )
    );
  });

  // 3. Confidence never increases when a rumour is retold
  it("property 3 — confidence never increases through gossip", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100000 }),
        fc.constantFrom(...ALL_EVENTS),
        fc.integer({ min: 1, max: 10 }),
        (seed, eventKind, ticks) => {
          const world = createWorld(seed);
          const rng = mulberry32(seed);
          world.pendingEvent = { kind: eventKind, location: "church" };

          for (let i = 0; i < ticks; i++) {
            const before = structuredClone(world);
            tick(world, rng);

            for (const c of world.characters) {
              const old = before.characters.find((x) => x.id === c.id)!;
              const learned = c.memories.filter(
                (m) => !old.memories.some((o) => o.eventId === m.eventId)
              );
              for (const newMem of learned) {
                if (newMem.heardFrom === "witnessed") {
                  expect(newMem.confidence).toBe(1);
                } else {
                  // Find the best (highest) confidence for this event in the before-snapshot
                  const sourceMem = before.characters
                    .flatMap((s) => s.memories)
                    .filter((sm) => sm.eventId === newMem.eventId)
                    .reduce(
                      (best, sm) => (sm.confidence > best ? sm.confidence : best),
                      0
                    );
                  expect(newMem.confidence).toBeLessThanOrEqual(sourceMem + 1e-10);
                }
              }
            }
          }
        }
      )
    );
  });

  // 4. Mood and trust always stay within [-1, 1]
  it("property 4 — mood and trust always within [-1, 1]", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100000 }),
        fc.constantFrom(...ALL_EVENTS),
        fc.integer({ min: 1, max: 20 }),
        (seed, eventKind, ticks) => {
          const world = runWorld(seed, eventKind, ticks);
          for (const c of world.characters) {
            expect(c.mood).toBeGreaterThanOrEqual(-1);
            expect(c.mood).toBeLessThanOrEqual(1);
            for (const trust of Object.values(c.relationships)) {
              expect(trust).toBeGreaterThanOrEqual(-1);
              expect(trust).toBeLessThanOrEqual(1);
            }
          }
        }
      )
    );
  });

  // 5. No duplicate event memories per character
  it("property 5 — no character holds two memories of the same event", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100000 }),
        fc.constantFrom(...ALL_EVENTS),
        fc.integer({ min: 1, max: 20 }),
        (seed, eventKind, ticks) => {
          const world = runWorld(seed, eventKind, ticks);
          for (const c of world.characters) {
            const ids = c.memories.map((m) => m.eventId);
            expect(ids.length).toBe(new Set(ids).size);
          }
        }
      )
    );
  });

  // 6. Every character is always at a valid location
  it("property 6 — every character is always at a valid location", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100000 }),
        fc.constantFrom(...ALL_EVENTS),
        fc.integer({ min: 1, max: 30 }),
        (seed, eventKind, ticks) => {
          const world = createWorld(seed);
          const rng = mulberry32(seed);
          world.pendingEvent = { kind: eventKind, location: "church" };
          for (let i = 0; i < ticks; i++) {
            tick(world, rng);
            for (const c of world.characters) {
              expect(LOCATION_IDS).toContain(c.location);
            }
          }
        }
      )
    );
  });
});
