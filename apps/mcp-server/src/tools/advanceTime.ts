import { tick } from "@the-underground/engine";
import { world, rng } from "../world-instance.js";

export function advanceTime(ticks: number) {
  const allLines: string[] = [];

  for (let i = 0; i < ticks; i++) {
    const result = tick(world, rng);
    allLines.push(...result.gossipLines);
  }

  return {
    content: [{
      type: "text" as const,
      text: JSON.stringify({
        ticksRun:    ticks,
        currentTick: world.tick,
        phase:       world.phase,
        gossipLines: allLines,
      }, null, 2),
    }],
  };
}
