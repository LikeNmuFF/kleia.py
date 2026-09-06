import { describe, expect, it } from "vitest";
import { shouldGrantBadge } from "./badges";

describe("badge granting", () => {
  it("grants First Blood when solves >= 1", () => {
    expect(shouldGrantBadge({ name: "First Blood", threshold: 1 }, { totalSolves: 1 })).toBe(true);
    expect(shouldGrantBadge({ name: "First Blood", threshold: 1 }, { totalSolves: 0 })).toBe(false);
  });

  it("grants Century Club when solves >= 100", () => {
    expect(shouldGrantBadge({ name: "Century Club", threshold: 100 }, { totalSolves: 100 })).toBe(true);
    expect(shouldGrantBadge({ name: "Century Club", threshold: 100 }, { totalSolves: 99 })).toBe(false);
  });

  it("grants Level 10 when level >= 10", () => {
    expect(shouldGrantBadge({ name: "Level 10", threshold: 10 }, { level: 10 })).toBe(true);
    expect(shouldGrantBadge({ name: "Level 10", threshold: 10 }, { level: 9 })).toBe(false);
  });

  it("grants streak badge when streak >= threshold", () => {
    expect(shouldGrantBadge({ name: "Dedication", threshold: 30 }, { streak: 30 })).toBe(true);
    expect(shouldGrantBadge({ name: "Dedication", threshold: 30 }, { streak: 29 })).toBe(false);
  });
});
