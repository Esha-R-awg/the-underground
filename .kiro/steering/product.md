# Product: The Underground

## What it is

The Underground is a living, haunted village simulation. Autonomous characters have jobs, moods, memories and relationships. The user triggers a mysterious event and watches the reaction spread through the village: who witnessed it, who heard about it through gossip, how the story changes with each retelling, and how moods shift over time.

## Layer 1 goal

Deliver a small but complete, deployed, polished loop:
- Trigger an event
- Watch the village react (witnessing, gossip, mood changes)
- Inspect any character's memory and confidence

Layer 1 must be deployed and demo-ready before any later layer begins.

## In scope for Layer 1

- Village map with 6 locations and 6 characters
- A tick loop with a day/night cycle; characters move between locations based on job and time of day
- Three triggerable events: Blackout, Missing Bell, Stranger Arrives
- Witnessing, gossip and mood rules (see simulation-rules section of brief)
- Character panel (memories, confidence bars, relationships) and a live gossip feed
- Haunted visual style: fog, lantern flicker, character animation
- MCP server exposing the same world through five tools
- Property-based tests for all engine invariants
- Deployment as a static site (Vercel, Netlify or GitHub Pages)

## Out of scope for Layer 1

- LLM calls of any kind
- User accounts or authentication
- A database (all state is in-memory)
- Multiplayer
- Mobile-perfect layout
- A live WebSocket bridge between the MCP server and the browser
- Sound

## Cast

| Name        | Job            | Home      | Gossipy |
|-------------|----------------|-----------|---------|
| Mara        | Innkeeper       | Inn       | 0.9     |
| Father Edwin| Priest          | Church    | 0.3     |
| Tobias      | Miller          | Mill      | 0.4     |
| Wren        | Gravedigger     | Graveyard | 0.2     |
| Odalys      | Fortune teller  | Square    | 0.7     |
| Alder       | Night watchman  | Well      | 0.5     |

## Locations

Inn, Church, Mill, Graveyard, Square, Well.

## Events

| Event           | Where         | Effect                                                                 |
|-----------------|---------------|------------------------------------------------------------------------|
| Blackout        | Whole village | Everyone witnesses it. Mood −0.2. Light radius shrinks to lanterns.    |
| Missing Bell    | Church        | Only people at the church witness it. Mood −0.3 for witnesses.         |
| Stranger Arrives| Square        | Witnesses at the square gain a memory. Trust toward stranger is lower for characters who distrust outsiders. |

## Later layers (do not build yet)

More characters, richer memory, LLM dialogue (≤3B model via Ollama), sound, live MCP-to-browser bridge.
