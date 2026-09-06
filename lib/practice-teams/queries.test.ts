import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = () => readFileSync(join(process.cwd(), "lib", "practice-teams", "queries.ts"), "utf8");

describe("practice team query contracts", () => {
  it("exposes team leaderboard and recent solve helpers without key hashes", () => {
    const code = source();

    expect(code).toContain("getPracticeTeamLeaderboard");
    expect(code).toContain("getPracticeTeamRecentSolves");
    expect(code).toContain("practice_team_solves");
    expect(code).toContain("ctf_challenges");
    expect(code).toContain("total_solves");
    expect(code).not.toContain("key_hash");
  });
});
