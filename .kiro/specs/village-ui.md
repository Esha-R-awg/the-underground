# Spec: Village UI

Covers milestones **M3** (working village) and **M4** (haunted polish). Depends on engine-core and events-and-gossip.

## Requirements

### M3 — Working village

1. `npm run dev` starts the Vite dev server and the app loads without errors.
2. The canvas shows the six locations as labelled areas on the map.
3. Each character is rendered at their current engine location.
4. Characters move smoothly between locations (eased interpolation in the renderer — the engine teleports them, the UI animates the visual position toward the engine position).
5. Clicking a character opens the character panel showing: name, job, mood, memory list (text, who told them, confidence bar), and trust bars for each relationship.
6. The gossip feed panel scrolls and shows lines from `world.gossipFeed`.
7. Three event buttons trigger the corresponding event on the next engine tick.
8. The app reads from the engine (`packages/engine`) only — no duplicate logic.
9. A tick runs every 1 second (setInterval or requestAnimationFrame-based timer, configurable).

### M4 — Haunted polish

10. Two or three fog layers drift slowly across the canvas.
11. Lantern flicker: each location's light circle oscillates subtly in radius and opacity.
12. Faint vignette (radial gradient darkening edges).
13. Soft moonlight gradient wash from the top of the canvas.
14. Event effects:
    - **Blackout**: scene darkens to near-black; only small light circles around lanterns remain. Reverses after a configurable number of ticks.
    - **Missing Bell**: church icon jitters (translate shake animation); an echo ring expands outward and fades.
    - **Stranger Arrives**: a figure fades in at the square (opacity 0 → 1 over ~1 second).
15. Characters have a short ghostly trail (3–5 fading dots behind them).
16. `prefers-reduced-motion`: when set, disable shake and heavy fog movement; keep static fog and vignette.
17. Particle cap: never more than ~150 active particles on screen at once.
18. No CSS `blur` on large areas; all blur-like effects are pre-rendered to offscreen canvases.

## Design

### File layout

```
apps/web/src/
  main.tsx                  React entry point
  App.tsx                   root component, holds engine world state
  engine/
    useSimulation.ts        React hook: runs tick loop, exposes world + triggerEvent
  canvas/
    Renderer.ts             Canvas 2D renderer class
    layers/
      BackgroundLayer.ts    map, locations, moonlight, vignette
      FogLayer.ts           drifting fog (offscreen canvas)
      CharacterLayer.ts     character shapes, trails
      LightLayer.ts         lantern circles, blackout overlay
      EffectsLayer.ts       event effect animations (bell echo, stranger fade-in)
  components/
    CharacterPanel.tsx      selected character info
    GossipFeed.tsx          scrolling feed
    EventButtons.tsx        three trigger buttons
  assets/
    sprites-manifest.ts     maps character IDs to image paths (placeholder paths until Esha provides art)
  styles/
    global.css              base styles, CSS variables for palette
```

### Palette CSS variables

```css
--color-bg:        #1a1428;   /* deep indigo */
--color-bg-alt:    #12101e;   /* charcoal */
--color-highlight: #b8a4d8;   /* moonlit lavender */
--color-lantern:   #e8a040;   /* warm amber */
--color-text:      #e0d8f0;   /* light lavender-white */
```

### Renderer loop

```
requestAnimationFrame → Renderer.draw(world, interpolation)
  1. Clear canvas
  2. BackgroundLayer.draw()
  3. FogLayer.draw()
  4. LightLayer.draw()          (lanterns, blackout overlay)
  5. CharacterLayer.draw()      (trails then characters)
  6. EffectsLayer.draw()        (echo rings, stranger fade)
```

### useSimulation hook

- Holds `world` in React state.
- Runs `tick(world, rng)` on a 1-second interval.
- Exposes `triggerEvent(kind, location)` which sets `world.pendingEvent` and runs a tick immediately.
- The RNG instance is created once from a fixed seed (or a seed from the URL hash for repeatability).

### Sprites manifest

```ts
// apps/web/src/assets/sprites-manifest.ts
export const SPRITES: Record<string, string> = {
  mara:         "/sprites/placeholder.svg",
  father_edwin: "/sprites/placeholder.svg",
  // …
};
```

Esha replaces the paths with her own art when ready.

## Tasks

- [ ] Scaffold `apps/web` with `npm create vite@latest`
- [ ] Write `useSimulation.ts`
- [ ] Write `Renderer.ts` and all layer files (placeholder shapes, no art yet)
- [ ] Write `CharacterPanel.tsx`, `GossipFeed.tsx`, `EventButtons.tsx`
- [ ] Connect panels to real engine world state
- [ ] M3 acceptance: dev server shows village with real memories
- [ ] Add fog, flicker, vignette, moonlight (M4)
- [ ] Add event effects (M4)
- [ ] Add trails, reduced-motion support (M4)
- [ ] M4 acceptance: smooth on the i5 laptop, reduced-motion works

## Acceptance checks

**M3**: `npm run dev` shows the village; clicking a character shows real memories from the engine; event buttons trigger events; gossip feed updates.

**M4**: Fog, flicker and event effects run at stable frame rate on the i5 laptop without fan-roar; `prefers-reduced-motion` disables shake and heavy fog.
