import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = () => readFileSync(join(process.cwd(), "app", "actions", "gamification.ts"), "utf8");

describe("gamification actions", () => {
  it("exports awardXp function", () => {
    expect(source()).toContain("awardXp");
  });

  it("exports createSeasonAction function", () => {
    expect(source()).toContain("createSeasonAction");
  });

  it("exports endSeasonAction function", () => {
    expect(source()).toContain("endSeasonAction");
  });

  it("exports checkAndGrantBadges function", () => {
    expect(source()).toContain("checkAndGrantBadges");
  });
});
