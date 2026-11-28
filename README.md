# The Underground

*A village of whispers.* A haunted village simulation where autonomous characters
witness events, share rumours, lose confidence in what they have heard, and change
their moods. Built for **Kiroween 2026** (Costume Contest category).

**Live demo:** _add your deployed URL here_ &nbsp;|&nbsp; **Demo video:** _add your YouTube link here_

## What you can do

1. Open the app. Six villagers follow daily routines between the Inn, Church, Mill,
   Graveyard, Square and Well, under a day and night sky.
2. Press **Blackout**, **Missing Bell** or **Stranger Arrives**.
3. Watch who witnessed it (gold pulse), then watch the rumour spread (blue pulse)
   as villagers who trust each other meet and talk. Every retelling lowers the
   listener's confidence in the story.
4. Click any villager to read their mood, memories (who told them, how sure they
   are) and relationships. The feed at the bottom narrates every whisper.
5. Use **Pause / Step / 2x / Reset** to control time, or add `?seed=7` to the URL
   for a different village.

## How it works

The simulation is a small, deterministic engine (`packages/engine`) with no
dependency on the browser:

- **Routines.** Each villager has a day route and a night route; the night watchman
  patrols every location. Routines are tick-based, so there is no hidden randomness.
- **Events.** Anyone standing at the affected place when an event happens becomes a
  witness and gets a memory with 100% confidence plus a mood change.
- **Gossip.** Each tick, a villager may tell a trusted listener in the same place
  about an event the listener has not heard. The chance depends on how gossipy the
  speaker is and how much they trust the listener. News travels at most one hop per
  tick, and each retelling multiplies confidence by 0.9.
- **Seeded randomness.** All randomness comes from a seeded generator, so the same
  seed always produces the same village history.

## Project layout

```
packages/engine     rules, world state, events, gossip, routines, tests
apps/web            Vite + React + Canvas 2D village (responsive, high-DPI)
apps/mcp-server     MCP server exposing the same world over stdio
docs/kiro-log.md    running log of how Kiro was used
docs/manual-changes.md   changes made outside Kiro, and why
.kiro/              steering docs, specs, MCP config
```

## Run it locally

Requires Node.js 20 or newer.

```bash
npm install
npm run dev        # builds the engine, then starts the web app on http://localhost:5173
npm test           # engine + MCP server tests
npm run build      # builds everything (this is also the deploy build command)
```

## MCP server

`apps/mcp-server` exposes the village to any MCP client over stdio with five tools:
`list_characters`, `get_character_memory`, `trigger_event`, `advance_time` and
`get_world_summary`. It runs its own engine instance (it is not linked to the
browser view).

```bash
npm run build
node apps/mcp-server/dist/index.js
```

Example Kiro workspace config (`.kiro/settings/mcp.json`) when running on Linux or macOS:

```json
{
  "mcpServers": {
    "underground-world": {
      "command": "node",
      "args": ["apps/mcp-server/dist/index.js"]
    }
  }
}
```

If Kiro runs on Windows but the project's dependencies were installed inside WSL,
launch the server through WSL instead (adjust the paths to your machine):

```json
{
  "mcpServers": {
    "underground-world": {
      "command": "wsl",
      "args": ["/home/<user>/.nvm/versions/node/v20.20.2/bin/node",
               "/mnt/d/underground/apps/mcp-server/dist/index.js"]
    }
  }
}
```

## Testing

- Engine: unit tests plus property-based tests (fast-check) for the invariants
  that must always hold: news never teleports, runs are deterministic for a seed,
  confidence never increases when a rumour is retold, moods and trust stay in range,
  a character never holds two memories of the same event, and everyone is always at
  a valid location.
- Routines: tests that every event has a witness at day and night start times and
  that news spreads to several villagers on average.
- MCP server: tests for all five tools, including invalid input.

## Deploying

The build is a static site. On Vercel or Netlify, import the repository and use:

- Build command: `npm run build`
- Output directory: `apps/web/dist`

(`vercel.json` already contains these settings.)

## Built with Kiro

The project was planned and built in Kiro: steering docs and specs in `.kiro/`, the
engine and its tests, the first version of the web app, and the MCP server. Kiro's
credits ran out before the final polish, so the remaining work (day and night
routines, the redesigned village canvas, controls, this README and deployment
config) was finished outside Kiro. Everything done outside Kiro is listed in
[`docs/manual-changes.md`](docs/manual-changes.md), and Kiro's own account of its
work is in [`docs/kiro-log.md`](docs/kiro-log.md).

## License

MIT, see [LICENSE](LICENSE).
