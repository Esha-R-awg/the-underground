import type { LocationId } from "./types.js";

export const LOCATION_IDS: LocationId[] = [
  "inn",
  "church",
  "mill",
  "graveyard",
  "square",
  "well",
];

export const LOCATION_NAMES: Record<LocationId, string> = {
  inn:       "Inn",
  church:    "Church",
  mill:      "Mill",
  graveyard: "Graveyard",
  square:    "Square",
  well:      "Well",
};
