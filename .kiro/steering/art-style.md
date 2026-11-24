# Art Style and Visual Direction

## Palette

| Role                  | Colour description              |
|-----------------------|---------------------------------|
| Background            | Deep indigo / charcoal          |
| Highlights            | Moonlit lavender                |
| Light sources         | Warm lantern amber              |

No third-party artwork or music may be fetched or generated. All art is Esha's own. Placeholder shapes stand in until she provides sprites.

## Atmosphere effects

- **Fog**: two or three slowly drifting layers, rendered on Canvas 2D with pre-rendered gradient offscreen canvases.
- **Lantern flicker**: subtle alpha or radius oscillation on light circles.
- **Vignette**: faint radial gradient darkening the edges of the canvas.
- **Moonlight**: soft gradient wash from above.

## Character rendering

- Smooth eased walking between locations (no teleporting).
- Short ghostly trail behind each moving character (a few fading dots or a short alpha-fading line).
- Placeholder: simple coloured shapes (circle for head, rectangle for body) until Esha provides sprites.
- Sprites are loaded from `apps/web/src/assets/` via a sprites manifest file. The manifest maps character IDs to image paths so sprites can be swapped without changing engine code.

## Event effects

| Event            | Visual effect                                                       |
|------------------|---------------------------------------------------------------------|
| Blackout         | Scene darkens; only small light circles around lanterns remain.     |
| Missing Bell     | Church shakes (translate jitter); an echo ring expands outward.    |
| Stranger Arrives | A figure fades in at the square (opacity 0 → 1 over ~1 second).   |

## Panels and UI chrome

- **Character panel**: memory list (text, who told them, confidence bar), trust bars for each relationship.
- **Gossip feed**: scrolling list of readable lines, e.g. "Mara told Odalys about the bell".
- **Event buttons**: three clearly labelled buttons — Blackout, Missing Bell, Stranger Arrives.

## Performance limits (Intel Iris Xe integrated graphics)

- Use `requestAnimationFrame`; never block the main thread.
- Cap particle count at ~150.
- No CSS `blur` on large areas — use pre-rendered Canvas gradients instead.
- Pre-render fog and gradient layers to offscreen canvases; composite them each frame.
- No WebGL, no Three.js, no heavy shader work.

## Accessibility

- Respect `prefers-reduced-motion`: when set, disable shake animations and heavy fog movement.
- Keep all text at sufficient contrast ratio against the dark background.
