# Tech Stack

## Languages and runtime

- TypeScript, strict mode (`"strict": true` in every tsconfig). No `any` without a comment explaining why.
- Node.js 20 LTS or newer.
- npm workspaces (no pnpm, no Yarn).

## Packages

| Area        | Package                          |
|-------------|----------------------------------|
| Web app     | Vite + React + HTML Canvas 2D    |
| Tests       | Vitest + fast-check              |
| MCP server  | @modelcontextprotocol/sdk + zod  |

Do not add dependencies beyond these without asking Esha.

## Engine purity rules (non-negotiable)

The engine (`packages/engine`) is the single source of truth. Both the web app and the MCP server import it. These rules keep it testable and deterministic:

1. **No DOM** — no `document`, `window`, `HTMLElement` or any browser API.
2. **No `Math.random()`** — all randomness goes through the seeded `mulberry32` RNG passed in as a parameter.
3. **No `Date.now()` or `new Date()`** — time is tracked by the tick counter only.
4. **No network calls** — no `fetch`, no WebSocket, no anything async in engine logic.
5. **No side effects** — functions return new state or mutate the world object they receive; they never reach outside it.
6. World state must be fully JSON-serialisable at all times (no `Map`, no `Set`, no class instances with methods — plain objects and arrays only).

## Seeded RNG

Use `mulberry32(seed: number): () => number` from `packages/engine/src/rng.ts`. The same seed and the same sequence of calls must always produce the same world history. This is what makes property-based tests and repeatable demos possible.

## Web app

- Vite + React, bootstrapped with `npm create vite@latest apps/web -- --template react-ts`.
- Rendering: HTML Canvas 2D only. No WebGL, no Three.js, no heavy CSS blur on large areas.
- Performance ceiling (Intel Iris Xe integrated graphics): cap particles at ~150, pre-render gradients to offscreen canvases, use `requestAnimationFrame`.
- No model training, no GPU-dependent code, no local model calls in Layer 1.

## MCP server

- `apps/mcp-server`, stdio transport.
- Uses the engine package directly — it does not reimplement rules.
- Registered in the workspace's `.kiro/settings/mcp.json` so Kiro can call it during development.

## Deployment

- Static build of `apps/web` only.
- Target: Vercel, Netlify, or GitHub Pages (Esha decides).
- Deploy early — not on the last day.
