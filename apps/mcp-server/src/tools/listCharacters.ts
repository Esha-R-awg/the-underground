import { world } from "../world-instance.js";

export function listCharacters() {
  const result = world.characters.map((c) => ({
    id:       c.id,
    name:     c.name,
    job:      c.job,
    location: c.location,
    mood:     parseFloat(c.mood.toFixed(3)),
  }));
  return {
    content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
  };
}
