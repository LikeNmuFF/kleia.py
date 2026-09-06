import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const read = (...parts: string[]) => readFileSync(join(process.cwd(), ...parts), "utf8");

describe("practice team pages", () => {
  it("renders public team metadata and streak summaries on the list", () => {
    const page = read("app", "(main)", "teams", "page.tsx");
    const grid = read("components", "practice-teams", "PracticeTeamGrid.tsx");

    expect(page).toContain("getPublicPracticeTeams");
    expect(grid).toContain("current streak");
    expect(grid).toContain("longest");
  });

  it("renders member count and the shared calendar on profile pages", () => {
    const page = read("app", "(main)", "teams", "[slug]", "page.tsx");
    const calendar = read("components", "practice-teams", "PracticeTeamCalendar.tsx");

    expect(page).toContain("getPracticeTeamBySlug");
    expect(page).toContain("PracticeTeamCalendar");
    expect(page).toContain("member_count");
    expect(calendar).toContain("calendar.map");
    expect(calendar).toContain("aria-label");
  });

  it("includes create controls for profile fields and avatar", () => {
    const form = read("components", "practice-teams", "PracticeTeamForm.tsx");

    expect(form).toContain('name="name"');
    expect(form).toContain('name="slug"');
    expect(form).toContain('name="description"');
    expect(form).toContain('name="avatar"');
    expect(form).toContain('type="file"');
  });

  it("shows owner settings, member controls, revoke controls, and disables keys under five members", () => {
    const settings = read("components", "practice-teams", "PracticeTeamSettings.tsx");
    const members = read("components", "practice-teams", "PracticeTeamMembers.tsx");

    expect(settings).toContain("memberCount < 5");
    expect(settings).toContain("disabled={memberCount < 5}");
    expect(settings).toContain("revokePracticeTeamApiKey");
    expect(members).toContain("removePracticeTeamMember");
  });
});
