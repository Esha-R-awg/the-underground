# Spec: MCP Server

Covers milestone **M5**. Depends on engine-core and events-and-gossip.

## Requirements

1. `apps/mcp-server` runs as a stdio MCP server using `@modelcontextprotocol/sdk`.
2. The server imports and uses `packages/engine` directly — it does not reimplement any rules.
3. The server maintains a single `World` instance in memory, initialised with a fixed seed on startup.
4. All five tools are registered and respond correctly.
5. The server is registered in `d:\underground\.kiro\settings\mcp.json` so Kiro can call it during development.
6. Each tool validates its input with Zod and returns a meaningful error message if validation fails.

## Tools

### `list_characters`

- **Input**: none
- **Output**: JSON array of `{ id, name, job, location, mood }` for every character in the current world.

### `get_character_memory`

- **Input**: `{ characterId: string }`
- **Output**: JSON object `{ characterId, name, memories: Memory[] }` where each memory includes `eventId`, `tick`, `heardFrom`, `text`, `confidence`.
- **Error**: if `characterId` is not found, return a clear error message.

### `trigger_event`

- **Input**: `{ kind: "blackout" | "missing_bell" | "stranger_arrives", location: string }`
- **Behaviour**: sets `world.pendingEvent` and runs one tick.
- **Output**: the gossip feed lines produced by that tick, plus the new world tick number.
- **Note**: `location` is ignored for `blackout` (whole village) but must still be accepted.

### `advance_time`

- **Input**: `{ ticks: number }` (1–100, validated with Zod `.min(1).max(100)`)
- **Behaviour**: runs `n` ticks, collecting all gossip feed lines.
- **Output**: `{ ticksRun: number, gossipLines: string[] }`.

### `get_world_summary`

- **Input**: none
- **Output**: a short narrative paragraph describing the current state: tick number, day/night phase, each character's location and mood in plain English, and the most recent gossip line if any.

## Design

### File layout

```
apps/mcp-server/
  src/
    index.ts        server entry point, tool registration
    tools/
      listCharacters.ts
      getCharacterMemory.ts
      triggerEvent.ts
      advanceTime.ts
      getWorldSummary.ts
    world-instance.ts   singleton world + rng (seed = 1234 by default)
  package.json
  tsconfig.json
```

### world-instance.ts

```ts
import { createWorld, mulberry32 } from "@the-underground/engine";
export const world = createWorld(1234);
export const rng   = mulberry32(1234);
```

The seed can be overridden by a `WORLD_SEED` environment variable (read once at startup, never committed).

### MCP config (workspace)

`d:\underground\.kiro\settings\mcp.json`:

```json
{
  "mcpServers": {
    "underground-world": {
      "command": "node",
      "args": ["apps/mcp-server/dist/index.js"],
      "type": "stdio"
    }
  }
}
```

Build the server (`npm run build -w apps/mcp-server`) before connecting.

### SDK registration pattern

Use `server.tool(name, zodSchema, handler)` as shown in the brief. If the installed SDK version uses a different API, follow its documentation and note the difference in `docs/kiro-log.md`.

## Tasks

- [ ] Scaffold `apps/mcp-server` package (package.json, tsconfig.json)
- [ ] Write `world-instance.ts`
- [ ] Write all five tool handler files
- [ ] Write `index.ts` and register all tools
- [ ] Build the server (`npm run build -w apps/mcp-server`)
- [ ] Write `mcp.json` workspace config
- [ ] Verify Kiro can call `trigger_event` and `get_character_memory` via MCP
- [ ] Write `mcp-server.test.ts` — unit tests for each tool handler (mock transport, real engine)
- [ ] Run tests, show output to Esha

## Acceptance check (M5 done when)

- All five tools respond without error.
- Kiro calls `trigger_event` (e.g. `missing_bell` at `church`) and then `get_character_memory` (e.g. for `father_edwin`) and the returned memory reflects the event.
- `advance_time` with `{ ticks: 5 }` returns five or fewer gossip lines (may be zero if no gossip occurred).
- Tests pass. Output shown.
