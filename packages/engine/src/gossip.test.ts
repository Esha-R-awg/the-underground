import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { mulberry32 } from "./rng.js";
import { gossipStep } from "./gossip.js";
import type { World, Character } from "./types.js";

const CHARACTER_IDS = ["a", "b", "c", "d"] as const;
const LOCS = ["inn", "church", "mill"] as const;

const charArb = (id: string): fc.Arbitrary<Character> =>
  fc.record({
    id:       fc.constant(id),
    name:     fc.constant(id),
    job:      fc.constant("villager"),
    location: fc.constantFrom(...LOCS),
    mood:     fc.double({ min: -1, max: 1, noNaN: true }),
    gossipy:  fc.double({ min: 0,  max: 1, noNaN: true }),
    relationships: fc.dictionary(
      fc.constantFrom(...CHARACTER_IDS),
      fc.double({ min: -1, max: 1, noNaN: true })
    ),
    memories: fc.constantFrom(
      [],
      [{
        eventId:    "e1",
        tick:       0,
        heardFrom:  "witnessed" as const,
        text:       "something happened",
        confidence: 1,
      }]
    ),
  });

const worldArb: fc.Arbitrary<World> = fc
  .tuple(...CHARACTER_IDS.map(charArb))
  .map((characters) => ({
    tick:            1,
    phase:           "day" as const,
    characters,
    pendingEvent:    null,
    gossipFeed:      [],
    blackoutActive:  false,
    blackoutClearAt: 0,
  }));

describe("gossipStep — property-based", () => {
  it("never teleports news: new memories come only from co-located speakers who already knew the event", () => {
    fc.assert(
      fc.property(worldArb, fc.integer(), (world, seed) => {
        const before = structuredClone(world);
        gossipStep(world, mulberry32(seed));

        for (const c of world.characters) {
          const old = before.characters.find((x) => x.id === c.id)!;
          const learned = c.memories.filter(
            (m) => !old.memories.some((o) => o.eventId === m.eventId)
          );
          for (const m of learned) {
            const source = before.characters.find(
              (s) =>
                s.id === m.heardFrom &&
                s.location === c.location &&
                s.memories.some((sm) => sm.eventId === m.eventId)
            );
            expect(source).toBeDefined();
          }
        }
      })
    );
  });

  it("is deterministic: same world clone and same seed produce identical results", () => {
    fc.assert(
      fc.property(worldArb, fc.integer(), (world, seed) => {
        const w1 = structuredClone(world);
        const w2 = structuredClone(world);
        gossipStep(w1, mulberry32(seed));
        gossipStep(w2, mulberry32(seed));
        expect(w1).toEqual(w2);
      })
    );
  });

  it("confidence never increases when a memory is retold", () => {
    fc.assert(
      fc.property(worldArb, fc.integer(), (world, seed) => {
        const before = structuredClone(world);
        gossipStep(world, mulberry32(seed));

        for (const c of world.characters) {
          const old = before.characters.find((x) => x.id === c.id)!;
          const learned = c.memories.filter(
            (m) => !old.memories.some((o) => o.eventId === m.eventId)
          );
          for (const newMem of learned) {
            // Find the source memory in the before-snapshot
            const sourceBefore = before.characters
              .flatMap((s) => s.memories)
              .find((sm) => sm.eventId === newMem.eventId);
            if (sourceBefore) {
              expect(newMem.confidence).toBeLessThanOrEqual(sourceBefore.confidence + 1e-10);
            }
          }
        }
      })
    );
  });

  it("produces no duplicate event memories per character", () => {
    fc.assert(
      fc.property(worldArb, fc.integer(), (world, seed) => {
        gossipStep(world, mulberry32(seed));
        for (const c of world.characters) {
          const ids = c.memories.map((m) => m.eventId);
          const unique = new Set(ids);
          expect(ids.length).toBe(unique.size);
        }
      })
    );
  });
});
