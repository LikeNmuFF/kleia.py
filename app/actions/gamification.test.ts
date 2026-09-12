import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = () => readFileSync(join(process.cwd(), "app", "actions", "gamification.ts"), "utf8");

describe("gamification actions", () => {
  it("keeps awardXp internal to the server action module", () => {
    expect(source()).toContain("awardXp");
    expect(source()).toContain("async function awardXp");
    expect(source()).not.toContain("export async function awardXp");
  });

  it("exports createSeasonAction function", () => {
    expect(source()).toContain("createSeasonAction");
  });

  it("exports endSeasonAction function", () => {
    expect(source()).toContain("endSeasonAction");
  });

  it("keeps badge granting internal to the server action module", () => {
    expect(source()).toContain("checkAndGrantBadges");
    expect(source()).toContain("async function checkAndGrantBadges");
    expect(source()).not.toContain("export async function checkAndGrantBadges");
  });
});
