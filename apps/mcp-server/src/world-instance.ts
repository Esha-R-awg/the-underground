import { createWorld, mulberry32 } from "@the-underground/engine";
import type { World, Rng } from "@the-underground/engine";

const seed = process.env["WORLD_SEED"] !== undefined
  ? parseInt(process.env["WORLD_SEED"], 10)
  : 1234;

export const world: World = createWorld(seed);
export const rng: Rng     = mulberry32(seed);
