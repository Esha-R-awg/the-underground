# Spec: Events and Gossip

Covers milestone **M2**. Depends on engine-core (M1).

## Requirements

1. Three events are supported: `blackout`, `missing_bell`, `stranger_arrives`.
2. Events are queued via `world.pendingEvent` and resolved during `tick()`.
3. **Blackout**: every character in the village (all locations) becomes a witness. Mood −0.2 for each witness. Light radius shrinks (flag on world state for the UI).
4. **Missing Bell**: only characters currently at the `"church"` location become witnesses. Mood −0.3 for each witness.
5. **Stranger Arrives**: only characters at the `"square"` location become witnesses. Each witness gains a memory. Trust toward the stranger is reduced by `0.2 × (1 − character.gossipy)` (more distrustful characters lose more trust), floored at −1.
6. A witness gets a `Memory` with `heardFrom: "witnessed"`, `confidence: 1.0`, and a descriptive `text` string.
7. A character already holding a memory for an event (by `eventId`) does not get a duplicate.
8. **Gossip step** (runs every tick after event resolution):
   - Speaker and listener must be in the same location.
   - Speaker must have `relationships[listenerId] > 0` (positive trust toward listener).
   - Listener must not already know the event (`!listener.memories.some(m => m.eventId === eventId)`).
   - Roll `rng() < speaker.gossipy * trust` to decide if gossip happens.
   - If it does: listener gains a copy of the memory with `heardFrom: speaker.id`, `confidence: memory.confidence × 0.9`, `tick: world.tick`.
   - Speakers only share what they knew at the **start** of the gossip round (snapshot before iteration).
   - Append a readable line to `world.gossipFeed`: e.g. `"Mara told Odalys about the missing bell"`.
9. **Mood drift**: after gossip, each character's mood moves 0.05 toward 0, clamped to `[−1, 1]`.
10. All mood and trust values must always stay within `[−1, 1]`.

## Design

### Files

```
packages/engine/src/
  events.ts     resolveEvent(world, event): void
  gossip.ts     gossipStep(world, rng): string[]
```

`events.ts` and `gossip.ts` are called from `tick.ts`; they do not call each other.

### Event IDs

Use stable string IDs so memories can be matched across characters:

```ts
const EVENT_IDS = {
  blackout:          "evt_blackout",
  missing_bell:      "evt_missing_bell",
  stranger_arrives:  "evt_stranger_arrives",
} as const;
```

### Gossip snapshot pattern

```ts
const snapshot = world.characters.map(c => ({
  id: c.id,
  location: c.location,
  memories: [...c.memories],        // shallow copy of the array
  gossipy: c.gossipy,
  relationships: c.relationships,
}));
// iterate snapshot for speakers, mutate world.characters for listeners
```

## Property-based tests (all must pass with fast-check)

These map directly to the six engine invariants in the brief:

1. **No teleportation** — after `gossipStep`, any newly learned memory's `heardFrom` ID must point to a character who (a) was in the same location as the learner and (b) already knew that event at the start of the round.
2. **Determinism** — `gossipStep` with the same world clone and same seed produces identical results.
3. **Confidence never increases** — for every memory transferred, `newMemory.confidence ≤ sourceMemory.confidence`.
4. **Mood and trust bounds** — after any number of ticks, all mood and trust values are in `[−1, 1]`.
5. **No duplicate event memories** — no character ever holds two memories with the same `eventId`.
6. **Valid locations** — every character's `location` is always a member of the six defined location IDs.

## Tasks

- [ ] Write `events.ts` (resolveEvent for all three events)
- [ ] Write / update `gossip.ts` to match snapshot pattern and return feed lines
- [ ] Write `events.test.ts` — unit tests: blackout hits everyone, missing_bell only hits church, stranger_arrives only hits square, mood is clamped, no duplicates
- [ ] Write `gossip.test.ts` — property-based tests for all six invariants
- [ ] Run tests, show output to Esha

## Acceptance check (M2 done when)

- All three events resolve correctly in unit tests.
- All six property-based tests pass with zero shrink failures.
- `npm test -w packages/engine` exits 0 (output shown).
