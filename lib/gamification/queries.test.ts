import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = () => readFileSync(join(process.cwd(), "lib", "gamification", "queries.ts"), "utf8");

describe("gamification queries", () => {
  it("exports getUserGamification function", () => {
    expect(source()).toContain("getUserGamification");
  });

  it("exports getTeamGamification function", () => {
    expect(source()).toContain("getTeamGamification");
  });

  it("exports getUserLeaderboard function", () => {
    expect(source()).toContain("getUserLeaderboard");
  });

  it("exports getTeamLeaderboard function", () => {
    expect(source()).toContain("getTeamLeaderboard");
  });
});
