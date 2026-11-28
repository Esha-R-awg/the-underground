# Changes made outside Kiro

Kiro built the foundation of this project (steering docs, specs, the engine and its
tests, the first web UI, the MCP server). Its credits ran out before the final
polish. The changes below were made afterwards by Esha with help from Claude, and are
listed here so the history stays honest. Kiro's own log is in `docs/kiro-log.md`.

## Engine (`packages/engine`)

- `src/schedule.ts`: replaced the fixed per-character posts with daily routines
  (each villager visits several places per day and night). Reason: with fixed posts
  almost nobody met anybody, so news spread to only about 2.6 of 6 villagers within
  24 ticks on average; with routines it is about 4 to 5. Chosen by simulating many
  seeds and also checking that the church and the square always have someone present,
  so an event never happens with no witness. First stops still match the original
  starting positions, and Odalys is still at the square on the last day tick.
- `src/events.test.ts`: fixed property 1 ("no teleportation"). It compared the
  speaker's position from before the tick with the listener's position after
  movement, which only passed because almost nobody moved under the old schedule.
  The test now checks the same rule correctly: the speaker is in the same place as
  the listener after movement, and knew the news before the tick. The engine's
  gossip logic was not changed.
- `src/schedule.test.ts` (new): tests for the routines and for news spreading.

## Web app (`apps/web`)

- `src/canvas/renderer.ts`, `src/canvas/VillageCanvas.tsx`: rewritten. Responsive
  canvas that fills its area and stays sharp on high-DPI screens; drawn buildings,
  day and night sky, fog, lanterns; characters in tidy rows with initials, memory
  badges and mood rings; pulses showing who witnessed or heard an event.
- `src/engine/useSimulation.ts`: added pause, step, speed, reset and a feed with
  tick numbers. Default seed changed from 42 to 6 because news spreads well from
  that seed whenever an event is triggered. `?seed=N` still works.
- `src/components/Controls.tsx` (new), `GossipFeed.tsx`, `CharacterPanel.tsx`,
  `src/App.tsx`, `src/styles/global.css`: new controls, coloured feed with ticks,
  legend, location line, mood label fix (a mood of 0 now reads "Calm" instead of
  "Uneasy"), refreshed layout.
- `index.html`, `public/favicon.svg`: title, description, favicon.
- Removed unused Vite template files (`App.css`, `index.css`, `assets/`,
  `public/icons.svg`).
- `vite.config.ts`: relative asset paths (`base: './'`).

## MCP server (`apps/mcp-server`)

- `src/tools/getWorldSummary.ts`: same mood label fix as the web app.

## Repository

- `README.md` written; `vercel.json` and `.nvmrc` added.
- Root `package.json`: `npm run dev` now builds the engine first, so it works from a
  fresh clone.

## Verification at the time of these changes

- `npm test`: 44 engine tests and 19 MCP server tests passing.
- `npm run build`, TypeScript check and `oxlint` (0 warnings, 0 errors) clean.
- All five MCP tools were called over stdio and returned the expected results.
