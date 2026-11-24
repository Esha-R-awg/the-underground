# Spec: Village UI

Covers milestones **M3** (working village) and **M4** (haunted polish). Depends on engine-core and events-and-gossip.

---

## M3 Requirements — Working village

1. `npm run dev` starts the Vite dev server and the app loads in the browser without errors.
2. The canvas (800×600) shows all 6 locations as labelled rounded rectangles on a dark background.
3. Each character is rendered as a small coloured circle at their current engine location. No sprites yet.
4. Characters animate smoothly to their new engine location each tick (linear interpolation over 0.8 s).
5. Clicking a character opens a sidebar panel on the right showing:
   - Name, job, current mood (number and colour-coded bar)
   - Memory list: event text, who told them (`"witnessed"` or character name), confidence bar (0–100%)
   - Trust bars for each relationship (name + bar)
6. A scrolling gossip feed panel (bottom-left) shows all lines from `world.gossipFeed`, newest at the bottom.
7. Three event buttons (`Blackout`, `Missing Bell`, `Stranger Arrives`) set `world.pendingEvent` and trigger an immediate tick.
8. The app imports from `@the-underground/engine` only — no simulation logic duplicated in the UI.
9. The tick loop runs every 1 000 ms. The seed is fixed at `42` for repeatability; can be overridden via `?seed=<n>` in the URL.
10. The layout is usable at 1 280×720 and larger. No mobile requirement for M3.

**M3 explicitly excludes**: fog, vignette, lantern flicker, event visual effects, trails. Those are M4.

---

## M4 Requirements — Haunted polish (do not build yet)

11. Two or three slowly drifting fog layers (pre-rendered offscreen canvas).
12. Lantern flicker on each location's light circle.
13. Faint vignette radial gradient.
14. Soft moonlight gradient from the top of the canvas.
15. Event effects: Blackout darkens scene; Missing Bell shakes the church and expands an echo ring; Stranger Arrives fades a figure in.
16. Ghostly trail (3–5 fading dots) behind each moving character.
17. `prefers-reduced-motion`: disable shake and heavy fog movement.
18. Particle cap ~150. No CSS `blur` on large areas.

---

## Design

### File layout (M3)

```
apps/web/
  index.html
  package.json
  tsconfig.json
  vite.config.ts
  src/
    main.tsx                   React entry point
    App.tsx                    root layout: canvas + panels
    engine/
      useSimulation.ts         hook: world state, tick loop, triggerEvent
    canvas/
      VillageCanvas.tsx        <canvas> element + render loop
      renderer.ts              draw functions: map, characters
    components/
      CharacterPanel.tsx       selected character sidebar
      GossipFeed.tsx           scrolling gossip list
      EventButtons.tsx         3 event trigger buttons
    styles/
      global.css               CSS variables, reset, layout
```

### Layout

```
┌─────────────────────────────────────────────────────┐
│  [Blackout]  [Missing Bell]  [Stranger Arrives]      │  ← EventButtons (top bar)
├──────────────────────────────────────┬──────────────┤
│                                      │              │
│         VillageCanvas (800×600)      │  Character   │
│                                      │  Panel       │
│                                      │  (sidebar)   │
├──────────────────────────────────────┴──────────────┤
│  Gossip Feed (scrolling, ~120px tall)                │
└─────────────────────────────────────────────────────┘
```

### Palette (CSS variables)

```css
--color-bg:        #1a1428;
--color-bg-alt:    #12101e;
--color-highlight: #b8a4d8;
--color-lantern:   #e8a040;
--color-text:      #e0d8f0;
--color-positive:  #7ec87e;
--color-negative:  #c87e7e;
```

### Character colours (placeholder)

Each character gets a fixed distinct colour so they are visually distinguishable:

| ID           | Colour  |
|--------------|---------|
| mara         | #e8a040 |
| father_edwin | #a0c8e8 |
| tobias       | #c8a0e8 |
| wren         | #a0e8c8 |
| odalys       | #e8c8a0 |
| alder        | #c8e8a0 |

### Location positions on canvas (800×600)

| Location  | Centre x | Centre y |
|-----------|----------|----------|
| inn       | 160      | 150      |
| church    | 400      | 100      |
| mill      | 640      | 150      |
| graveyard | 160      | 420      |
| square    | 400      | 300      |
| well      | 640      | 420      |

### useSimulation hook

```ts
// Returns: { world, triggerEvent }
// - world is a React state value, updated by setWorld(structuredClone(w)) after each tick
// - triggerEvent(kind, location) sets pendingEvent then calls tick immediately
// - RNG created once from seed; seed read from URLSearchParams or defaults to 42
// - tick interval: 1 000 ms, cleared on unmount
```

### renderer.ts (pure draw functions, no React)

```ts
drawMap(ctx, locations)          // rounded rects + location name labels
drawCharacters(ctx, characters, visualPositions, selectedId)
//   visualPositions: Record<CharacterId, {x, y}> interpolated by VillageCanvas
```

---

## M3 Tasks

- [x] Scaffold `apps/web` with `npm create vite@latest ... --template react-ts`
- [x] Add `@the-underground/engine` as a workspace dependency
- [ ] Write `global.css` (variables, reset, layout grid)
- [ ] Write `useSimulation.ts`
- [ ] Write `renderer.ts` (drawMap, drawCharacters)
- [ ] Write `VillageCanvas.tsx` (canvas element, rAF loop, interpolation)
- [ ] Write `CharacterPanel.tsx`
- [ ] Write `GossipFeed.tsx`
- [ ] Write `EventButtons.tsx`
- [ ] Write `App.tsx`
- [ ] `npm run dev` works, village visible, panels show real engine data
- [ ] `npm test` still passes (engine tests unchanged)

---

## M3 Acceptance check

- `npm run dev` opens the browser with the village canvas, 6 labelled locations, 6 character circles.
- Clicking a character shows their name, mood, memories and trust in the sidebar.
- Clicking `Missing Bell` → Father Edwin's memory appears in the sidebar after 1 tick.
- The gossip feed scrolls as news spreads.
- `npm test` exits 0 (engine tests untouched).
