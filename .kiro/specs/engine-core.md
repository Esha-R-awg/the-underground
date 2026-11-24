# Spec: Engine Core

Covers milestone **M1**.

## Requirements

1. `createWorld(seed: number): World` initialises a world with 6 characters, 6 locations, and tick 0.
2. All character fields (mood, gossipy, relationships, memories) are set to their starting values from the brief.
3. `tick(world: World, rng: Rng): TickResult` advances the world by one step and returns a `TickResult` containing any gossip feed lines produced.
4. Each tick advances `world.tick` by 1.
5. The day/night phase is derived from tick: a cycle of 24 ticks, ticks 0–11 = day, ticks 12–23 = night (then repeats).
6. Characters move toward the location their schedule dictates for the current phase (home at night, job location during the day — exact schedule per character from the brief).
7. The `mulberry32` RNG from `rng.ts` is the only source of randomness. It is passed in; the engine never constructs one itself.
8. World state serialises to JSON and deserialises back to an identical object (`JSON.parse(JSON.stringify(world))` deep-equals the original).
9. No `Math.random`, no `Date.now`, no DOM, no network calls anywhere in `packages/engine`.

## Design

### Files

```
packages/engine/src/
  rng.ts         mulberry32 implementation
  types.ts       CharacterId, LocationId, Memory, Character, World, TickResult
  schedule.ts    getScheduledLocation(character, phase): LocationId
  world.ts       createWorld(seed)
  tick.ts        tick(world, rng): TickResult
  index.ts       re-exports everything public
```

### Types (extend as needed, never remove fields)

```ts
export type Phase = "day" | "night";

export interface TickResult {
  gossipLines: string[];
}

export interface World {
  tick: number;
  phase: Phase;
  characters: Character[];
  pendingEvent: QueuedEvent | null;
  gossipFeed: string[];
}

export interface QueuedEvent {
  kind: "blackout" | "missing_bell" | "stranger_arrives";
  location: LocationId;   // ignored for blackout (whole village)
}
```

### Schedule rules

| Character    | Day location | Night location |
|--------------|--------------|----------------|
| Mara         | Inn          | Inn            |
| Father Edwin | Church       | Church         |
| Tobias       | Mill         | Mill           |
| Wren         | Graveyard    | Graveyard      |
| Odalys       | Square       | Inn            |
| Alder        | Well         | (patrols: cycles through all locations every 6 ticks) |

Alder's patrol: `locations[Math.floor(tick / 6) % locations.length]` (using tick, not random).

### Tick order

1. Advance `world.tick` and recompute `world.phase`.
2. Move each character one step toward their scheduled location (instant in Layer 1 — teleport to scheduled location; walking animation is handled by the UI, not the engine).
3. Resolve `world.pendingEvent` if set (see events-and-gossip spec). Clear it after resolution.
4. Run `gossipStep(world, rng)`.
5. Apply mood drift: each character's mood moves 0.05 toward 0, clamped to `[-1, 1]`.
6. Collect and append gossip feed lines. Clear per-tick lines from the result but keep the full feed on `world.gossipFeed`.
7. Return `TickResult`.

## Tasks

- [ ] Write `rng.ts` (mulberry32)
- [ ] Write `types.ts`
- [ ] Write `schedule.ts`
- [ ] Write `world.ts` (createWorld)
- [ ] Write `tick.ts` (tick loop, steps 1–7)
- [ ] Write `index.ts`
- [ ] Write `rng.test.ts` — unit tests: same seed same sequence, different seeds differ
- [ ] Write `world.test.ts` — serialisation round-trip, determinism across two ticks
- [ ] Write `tick.test.ts` — phase advances, characters move to schedule, mood drift clamps
- [ ] Run tests, show output to Esha

## Acceptance check (M1 done when)

- `createWorld(seed)` and `tick()` work without throwing.
- Determinism test passes: `createWorld(42)` ticked 10 times with the same RNG seed produces an identical world to a second run with the same seed.
- `JSON.parse(JSON.stringify(world))` deep-equals the original world.
- `npm test -w packages/engine` exits 0 with all tests passing (output shown).
