import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = () => readFileSync(join(process.cwd(), "app", "actions", "practice-teams.ts"), "utf8");

describe("practice team actions", () => {
  it("creates the owner membership when creating a team", () => {
    const code = source();

    expect(code).toContain('.from("practice_teams")');
    expect(code).toContain('.from("practice_team_members")');
    expect(code).toContain('role: "owner"');
    expect(code).toContain('status: "accepted"');
  });

  it("protects authorization and owner removal", () => {
    const code = source();

    expect(code).toContain("async function requireTeamManager");
    expect(code).toContain('return { error: "Unauthorized" }');
    expect(code).toContain("Cannot remove the team owner");
  });

  it("enforces the five accepted member prerequisite before key generation", () => {
    const code = source();

    expect(code).toContain("getAcceptedMemberCount");
    expect(code).toContain("acceptedMemberCount < 5");
    expect(code).toContain("at least 5 accepted members");
  });

  it("credits accepted member teams when a CTF solve is correct", () => {
    const ctf = readFileSync(join(process.cwd(), "app", "actions", "ctf.ts"), "utf8");
    const practiceTeams = source();

    expect(ctf).toContain("creditPracticeTeamSolve");
    expect(ctf).toContain("creditPracticeTeamSolve(user.id, challengeId");
    expect(practiceTeams).toContain("export async function creditPracticeTeamSolve");
    expect(practiceTeams).toContain('if (!user || user.id !== userId) return { error: "Unauthorized" }');
    expect(practiceTeams).toContain('.from("practice_team_solves")');
    expect(practiceTeams).toContain('.from("practice_team_members")');
    expect(practiceTeams).toContain('.eq("status", "accepted")');
  });
});
