# Kiro Log — The Underground

Running log of how Kiro was used at each stage of the build, for the hackathon write-up.

---

## Setup — Steering docs and specs

**Feature used**: Kiro read the full project brief and authored all `.kiro/steering/` and `.kiro/specs/` files from scratch.

**Why**: The brief required steering docs before any code, so Kiro's context window is grounded in the project rules rather than guessing. Having the steering docs in place also means every future code task starts from the same shared understanding.

**What happened**: Five steering docs created (`product.md`, `tech.md`, `structure.md`, `art-style.md`, `testing.md`) and five spec docs created (`engine-core.md`, `events-and-gossip.md`, `village-ui.md`, `mcp-server.md`, `deploy-and-polish.md`). Specs shown to Esha for approval before any code is written.

---

## M0 — Repo and tooling

**Feature used**: Kiro ran all scaffolding commands directly via WSL (PowerShell → WSL bridge), set up nvm + Node 20 LTS, initialised the git repo, created the workspace structure, and ran the first `npm test`.

**Why**: The Windows PowerShell SSH passphrase prompt hangs non-interactively, so WSL was used for all git and npm operations. Node wasn't present in WSL, so nvm was installed first.

**What happened**: SSH verified (`Hi Esha-R-awg!`), Node 20.20.2 installed, `npm install` completed (5 audit warnings in dev deps — no production risk), `npm test` ran the placeholder test and exited 0. `.kiro` folder committed to repo, `.gitignore` confirmed it is not excluded.

---

## M1 — Engine core

**Feature used**: Kiro wrote all engine source files (`rng.ts`, `types.ts`, `locations.ts`, `schedule.ts`, `world.ts`, `events.ts`, `gossip.ts`, `tick.ts`) and four test files in one pass, then ran the tests and fixed three real failures before declaring M1 done.

**Why**: Writing tests alongside the code lets failures surface immediately in small named pieces rather than in a big rewrite later.

**What happened**: First run had 3 failures — phase boundary was off-by-one (`< 12` cut off tick 12 as night; fixed to `>= 1 && <= 12`), Odalys location test failed for the same reason, and a "different seeds produce different worlds" test was flawed (no events queued means the RNG never fires, so schedules are purely tick-based and identical regardless of seed; test rewritten to verify RNG sequences differ). All three fixed and confirmed. Final result: 4 test files, 20 tests, 0 failures.

---

## M2 — Events and gossip property tests

**Feature used**: Kiro wrote `events.test.ts` covering all three events with unit tests (12 tests) and all 6 engine invariants from section 7 of the brief with fast-check property tests (6 properties, 100 examples each).

**Why**: Property-based tests catch edge cases that example-based tests miss — the invariants in the brief are exactly the kind of thing fast-check is built for.

**What happened**: All 38 tests passed on the first run with no code changes needed.

---

## M3 — Village UI

**Feature used**: Kiro scaffolded the Vite + React + TypeScript app, wrote all UI source files (useSimulation hook, Canvas 2D renderer, CharacterPanel, GossipFeed, EventButtons, App layout), and wired them to the real engine.

**Why**: Building the UI as a thin shell over the engine — no simulation logic duplicated — means the engine tests remain the ground truth.

**What happened**: Built and type-checked cleanly on the first pass. Dev server started at `localhost:5173`. 38 engine tests still pass, unmodified.

---

## M4 — Haunted polish

**Feature used**: Kiro expanded the Canvas 2D renderer with pre-rendered offscreen layers: fog (3 drifting layers, seamless wrap), moonlight gradient, vignette, lantern flicker at every location, blackout overlay, church shake + echo ring on Missing Bell, stranger fade-in on Stranger Arrives, and ghostly character trails. `prefers-reduced-motion` disables all animation except static vignette and moonlight.

**Why**: All effects use pre-rendered offscreen canvases and simple trigonometry — no CSS blur, no WebGL, no particle systems over 150 — keeping it smooth on the Intel Iris Xe.

**What happened**: Build clean, 38 tests still passing, dev server up.

---

## M5 — MCP server

**Feature used**: Kiro scaffolded the full MCP server package, wrote all five tool handlers, wrote 19 unit tests, configured the workspace MCP config at `.kiro/settings/mcp.json`, and ran the complete test suite.

**Why**: The MCP server wraps the engine without duplicating logic — each tool handler is a thin function that calls into the same engine instance. This keeps the engine as the single source of truth.

**What happened**: First build attempt had 28 errors across two root causes — engine imports used `/src/index.js` subpath (not valid for NodeNext consumers), and the engine package had no compiled `dist/`. Fixed by: (1) adding a `dist` exports condition to engine `package.json`, (2) adding `skipLibCheck` to engine `tsconfig.json` to suppress a vite/rollup type conflict in hoisted `node_modules`, (3) building the engine to `dist/` before the MCP server build. One test failure: "gossip spreads after blackout" assumed gossip would fire after blackout, but all characters already witnessed it so there was nothing to spread — test rewritten to use `missing_bell` instead (correct engine behaviour). Final: 57 tests total, 0 failures. MCP config written to `.kiro/settings/mcp.json`. Live tool verification pending Kiro MCP panel reconnect.
