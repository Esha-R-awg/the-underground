import { LOCATION_NAMES } from "@the-underground/engine";
import { world } from "../world-instance.js";

function moodWord(mood: number): string {
  if (mood >  0.6) return "calm";
  if (mood >  0.2) return "content";
  if (mood > -0.2) return "uneasy";
  if (mood > -0.6) return "frightened";
  return "terrified";
}

export function getWorldSummary() {
  const phase     = world.phase === "day" ? "daytime" : "night";
  const lastGossip = world.gossipFeed.at(-1);

  const lines: string[] = [
    `The Underground — tick ${world.tick}, ${phase}.`,
    "",
    "Whereabouts:",
  ];

  for (const c of world.characters) {
    const locName = LOCATION_NAMES[c.location] ?? c.location;
    const mood    = moodWord(c.mood);
    const memories = c.memories.length;
    lines.push(
      `  ${c.name} (${c.job}) is at the ${locName}, feeling ${mood}` +
      (memories > 0 ? `, carrying ${memories} memory${memories > 1 ? "ies" : ""}` : "") +
      "."
    );
  }

  if (lastGossip) {
    lines.push("", `Latest gossip: "${lastGossip}"`);
  } else {
    lines.push("", "The village has been quiet so far — no gossip yet.");
  }

  if (world.blackoutActive) {
    lines.push("", "⚠ The village is currently in blackout.");
  }

  return {
    content: [{ type: "text" as const, text: lines.join("\n") }],
  };
}
