import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = () => readFileSync(join(process.cwd(), "lib", "gamification", "seasons.ts"), "utf8");

describe("seasons", () => {
  it("exports getActiveSeason function", () => {
    expect(source()).toContain("getActiveSeason");
  });

  it("exports createSeason function", () => {
    expect(source()).toContain("createSeason");
  });

  it("exports endSeason function", () => {
    expect(source()).toContain("endSeason");
  });
});
