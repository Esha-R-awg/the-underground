# Testing Strategy

## Tools

- **Vitest** — unit and integration tests for all packages.
- **fast-check** — property-based tests for the engine. Every invariant in the brief must have a `fc.assert(fc.property(...))` test.

## Coverage requirements

Every engine rule needs at least one unit test. The six properties from the brief need property-based tests that run with fast-check's default number of examples (100+).

## Engine properties (must all pass before M2 is closed)

These are the invariants the engine must satisfy for any valid world state and seed:

1. **No teleportation** — a character only learns about an event from someone who already knew it and shared their location at the time of the gossip step.
2. **Determinism** — same seed + same inputs → same world state at every tick.
3. **Confidence never increases** — when a memory is passed through gossip, `newConfidence ≤ oldConfidence`.
4. **Mood and trust bounds** — mood and all trust values always stay within `[-1, 1]` inclusive.
5. **No duplicate event memories** — a character never holds two memories with the same `eventId`.
6. **Valid locations** — every character's `location` is always one of the six defined location IDs.

## File organisation

```
packages/engine/src/
  rng.test.ts          unit tests for mulberry32
  gossip.test.ts       property tests for gossipStep (no-teleport, determinism)
  events.test.ts       unit + property tests for event resolution
  tick.test.ts         unit tests for the tick loop and schedule
  world.test.ts        serialisation round-trip test
```

## Hooks

- Saving any file under `packages/engine/src/` triggers `npm test -w packages/engine`.
- Saving any file under `apps/web/src/` triggers `tsc --noEmit` on the web app.

## Rules

- **Never say tests pass without running them and showing real output.**
- Tests must be run with `npm test` (or the workspace-scoped equivalent) and the terminal output shown to Esha.
- A milestone is not complete until its tests pass with zero failures and the output has been shown.
- Keep tests fast: the full engine test suite should finish in under 10 seconds.
- Do not mock the engine inside its own tests — test the real implementation.
