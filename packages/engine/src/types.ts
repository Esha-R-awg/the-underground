export type CharacterId = string;
export type LocationId = string;
export type Phase = "day" | "night";

export interface Memory {
  eventId: string;
  tick: number;
  heardFrom: CharacterId | "witnessed";
  text: string;
  confidence: number; // 0..1, drops each retelling
}

export interface Character {
  id: CharacterId;
  name: string;
  job: string;
  location: LocationId;
  mood: number;      // -1 (terrified) .. 1 (calm)
  gossipy: number;   // 0..1
  relationships: Record<CharacterId, number>; // trust -1..1
  memories: Memory[];
}

export type EventKind =
  | "blackout"
  | "missing_bell"
  | "stranger_arrives";

export interface QueuedEvent {
  kind: EventKind;
  location: LocationId; // ignored for blackout
}

export interface World {
  tick: number;
  phase: Phase;
  characters: Character[];
  pendingEvent: QueuedEvent | null;
  gossipFeed: string[];
  blackoutActive: boolean; // set by blackout event, cleared after 3 ticks
  blackoutClearAt: number; // tick at which blackout ends
}

export interface TickResult {
  gossipLines: string[];
}
