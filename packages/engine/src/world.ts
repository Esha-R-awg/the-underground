import type { World, Character } from "./types.js";
import { getScheduledLocation } from "./schedule.js";

function makeCharacter(
  id: string,
  name: string,
  job: string,
  gossipy: number,
  peers: string[]
): Character {
  // Start all relationships at a moderate positive trust (0.5),
  // except Tobias distrusts strangers — represented by lower baseline
  // which events can then reduce further.
  const relationships: Record<string, number> = {};
  for (const peerId of peers) {
    relationships[peerId] = id === "tobias" ? 0.3 : 0.5;
  }
  return {
    id,
    name,
    job,
    location: getScheduledLocation(id, "day", 0),
    mood: 0,
    gossipy,
    relationships,
    memories: [],
  };
}

export function createWorld(seed: number): World {
  // seed is accepted for determinism; character starting state is fixed.
  // The seed is used by the RNG passed into tick(), not here.
  void seed;

  const ids = ["mara", "father_edwin", "tobias", "wren", "odalys", "alder"];
  const peers = (id: string) => ids.filter((x) => x !== id);

  const characters: Character[] = [
    makeCharacter("mara",         "Mara",         "Innkeeper",      0.9, peers("mara")),
    makeCharacter("father_edwin", "Father Edwin",  "Priest",         0.3, peers("father_edwin")),
    makeCharacter("tobias",       "Tobias",        "Miller",         0.4, peers("tobias")),
    makeCharacter("wren",         "Wren",          "Gravedigger",    0.2, peers("wren")),
    makeCharacter("odalys",       "Odalys",        "Fortune teller", 0.7, peers("odalys")),
    makeCharacter("alder",        "Alder",         "Night watchman", 0.5, peers("alder")),
  ];

  return {
    tick: 0,
    phase: "day",
    characters,
    pendingEvent: null,
    gossipFeed: [],
    blackoutActive: false,
    blackoutClearAt: 0,
  };
}
