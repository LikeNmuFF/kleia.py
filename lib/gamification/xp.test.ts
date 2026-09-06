// lib/gamification/xp.test.ts
import { describe, expect, it } from "vitest";
import { calculateLevel, calculateXpForSolve, calculateStreakBonus } from "./xp";

describe("XP calculation", () => {
  it("calculates level from XP", () => {
    expect(calculateLevel(0)).toBe(1);
    expect(calculateLevel(999)).toBe(1);
    expect(calculateLevel(1000)).toBe(2);
    expect(calculateLevel(2500)).toBe(3);
    expect(calculateLevel(10000)).toBe(11);
  });

  it("calculates XP for solve by difficulty", () => {
    expect(calculateXpForSolve("easy")).toBe(50);
    expect(calculateXpForSolve("medium")).toBe(100);
    expect(calculateXpForSolve("hard")).toBe(200);
    expect(calculateXpForSolve("insane")).toBe(500);
  });

  it("calculates streak bonus capped at 100", () => {
    expect(calculateStreakBonus(0)).toBe(0);
    expect(calculateStreakBonus(1)).toBe(10);
    expect(calculateStreakBonus(5)).toBe(50);
    expect(calculateStreakBonus(10)).toBe(100);
    expect(calculateStreakBonus(30)).toBe(100);
  });
});
