import { world } from "../world-instance.js";

export function getCharacterMemory(characterId: string) {
  const c = world.characters.find((x) => x.id === characterId);
  if (!c) {
    return {
      content: [{
        type: "text" as const,
        text: `Error: no character with id "${characterId}". ` +
              `Valid ids: ${world.characters.map((x) => x.id).join(", ")}`,
      }],
      isError: true,
    };
  }

  const sourceName = (heardFrom: string) => {
    if (heardFrom === "witnessed") return "witnessed directly";
    const src = world.characters.find((x) => x.id === heardFrom);
    return src ? `told by ${src.name}` : `told by ${heardFrom}`;
  };

  const memories = c.memories.map((m) => ({
    eventId:    m.eventId,
    tick:       m.tick,
    source:     sourceName(m.heardFrom),
    text:       m.text,
    confidence: parseFloat((m.confidence * 100).toFixed(1)) + "%",
  }));

  const result = {
    id:       c.id,
    name:     c.name,
    location: c.location,
    mood:     parseFloat(c.mood.toFixed(3)),
    memories,
  };

  return {
    content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
  };
}
