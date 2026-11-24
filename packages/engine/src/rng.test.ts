import { describe, it, expect } from "vitest";
import { mulberry32 } from "./rng.js";

describe("mulberry32", () => {
  it("produces the same sequence for the same seed", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    for (let i = 0; i < 20; i++) {
      expect(a()).toBe(b());
    }
  });

  it("produces different sequences for different seeds", () => {
    const a = mulberry32(1);
    const b = mulberry32(2);
    const resultsA = Array.from({ length: 10 }, () => a());
    const resultsB = Array.from({ length: 10 }, () => b());
    expect(resultsA).not.toEqual(resultsB);
  });

  it("always returns values in [0, 1)", () => {
    const rng = mulberry32(99);
    for (let i = 0; i < 1000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});
