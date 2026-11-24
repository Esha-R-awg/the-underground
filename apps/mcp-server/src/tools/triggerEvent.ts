import { tick } from "@the-underground/engine";
import type { EventKind } from "@the-underground/engine";
import { world, rng } from "../world-instance.js";

export function triggerEvent(kind: EventKind, location: string) {
  world.pendingEvent = { kind, location };
  const result = tick(world, rng);

  return {
    content: [{
      type: "text" as const,
      text: JSON.stringify({
        tick:       world.tick,
        phase:      world.phase,
        event:      kind,
        location,
        gossipLines: result.gossipLines,
      }, null, 2),
    }],
  };
}
