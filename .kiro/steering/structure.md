# Repository Structure and Naming Conventions

## Layout

```
the-underground/
  .kiro/
    steering/        # product.md, tech.md, structure.md, art-style.md, testing.md
    specs/           # one .md per area (see below)
    hooks/           # event-driven hooks
    settings/        # mcp.json (workspace MCP config)
  apps/
    web/             # Vite + React app
    mcp-server/      # MCP server (stdio)
  packages/
    engine/          # pure TypeScript simulation engine
  docs/
    kiro-log.md      # running log of Kiro usage for the hackathon write-up
  LICENSE            # MIT
  README.md
  package.json       # npm workspaces root
```

## npm workspaces

Root `package.json` lists `"workspaces": ["packages/*", "apps/*"]`. Each workspace has its own `package.json` with its own dependencies and scripts.

## Key scripts (root)

| Script          | What it does                                      |
|-----------------|---------------------------------------------------|
| `npm run dev`   | Starts `apps/web` dev server                      |
| `npm test`      | Runs tests in all workspaces that have a test script |
| `npm run build` | Builds all workspaces                             |

## Naming conventions

- **Files**: `camelCase.ts` for source, `kebab-case.md` for docs, `kebab-case.json` for config.
- **Exported types**: `PascalCase` interfaces and type aliases.
- **Functions**: `camelCase`.
- **Constants**: `SCREAMING_SNAKE_CASE` for true compile-time constants, `camelCase` for everything else.
- **IDs**: string literals, e.g. `"mara"`, `"inn"`. Type aliases (`CharacterId`, `LocationId`) keep them from being confused with arbitrary strings.

## .kiro folder rules

- **Never** add `.kiro` or any sub-folder of it to `.gitignore`. It must be committed — the hackathon judges it.
- Steering docs live in `.kiro/steering/`.
- Specs live in `.kiro/specs/`.
- Hooks live in `.kiro/hooks/`.
- MCP workspace config lives in `.kiro/settings/mcp.json`.

## Commit conventions

- Small, clearly named commits. The history is part of the submission.
- Format: `type(scope): short description` — e.g. `feat(engine): add gossip step`, `test(engine): property tests for mood bounds`.
- Never commit `.env` files, SSH keys, or tokens.

## Spec files

| File                              | Covers                                        |
|-----------------------------------|-----------------------------------------------|
| `.kiro/specs/engine-core.md`      | World state, seeded RNG, tick loop, schedules |
| `.kiro/specs/events-and-gossip.md`| Events, witnessing, gossip, mood, property tests |
| `.kiro/specs/village-ui.md`       | Canvas renderer, panels, effects              |
| `.kiro/specs/mcp-server.md`       | Five MCP tools and their tests                |
| `.kiro/specs/deploy-and-polish.md`| Build, hosting, README, demo readiness        |
