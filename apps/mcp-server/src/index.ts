import { McpServer }          from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z }                   from "zod";

import { listCharacters }    from "./tools/listCharacters.js";
import { getCharacterMemory } from "./tools/getCharacterMemory.js";
import { triggerEvent }       from "./tools/triggerEvent.js";
import { advanceTime }        from "./tools/advanceTime.js";
import { getWorldSummary }    from "./tools/getWorldSummary.js";

const server = new McpServer({
  name:    "underground-world",
  version: "0.1.0",
});

// ── Tool: list_characters ─────────────────────────────────────────────────────
server.registerTool(
  "list_characters",
  {
    description: "Return the name, job, location and mood of every character in the village.",
  },
  () => listCharacters(),
);

// ── Tool: get_character_memory ────────────────────────────────────────────────
server.registerTool(
  "get_character_memory",
  {
    description: "Return everything one character knows: their memories, who told them each one, and the confidence level.",
    inputSchema: z.object({
      characterId: z.string().describe(
        "Character id. Valid values: mara, father_edwin, tobias, wren, odalys, alder"
      ),
    }),
  },
  ({ characterId }) => getCharacterMemory(characterId),
);

// ── Tool: trigger_event ───────────────────────────────────────────────────────
server.registerTool(
  "trigger_event",
  {
    description: "Trigger one of three village events and advance one tick. Returns the gossip lines produced.",
    inputSchema: z.object({
      kind: z.enum(["blackout", "missing_bell", "stranger_arrives"])
        .describe("The event to trigger."),
      location: z.string()
        .describe("Location hint. Use 'inn' for blackout, 'church' for missing_bell, 'square' for stranger_arrives."),
    }),
  },
  ({ kind, location }) => triggerEvent(kind, location),
);

// ── Tool: advance_time ────────────────────────────────────────────────────────
server.registerTool(
  "advance_time",
  {
    description: "Advance the simulation by n ticks (1–100) and return all gossip feed lines produced.",
    inputSchema: z.object({
      ticks: z.number().int().min(1).max(100).describe("Number of ticks to advance."),
    }),
  },
  ({ ticks }) => advanceTime(ticks),
);

// ── Tool: get_world_summary ───────────────────────────────────────────────────
server.registerTool(
  "get_world_summary",
  {
    description: "Return a short narrative summary of the current village state: tick, phase, each character's location and mood, and the latest gossip.",
  },
  () => getWorldSummary(),
);

// ── Connect ───────────────────────────────────────────────────────────────────
const transport = new StdioServerTransport();
await server.connect(transport);
