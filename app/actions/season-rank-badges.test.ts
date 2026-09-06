import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const source = () => readFileSync("app/actions/seasons.ts", "utf8");

describe("BaSCTF2026 rank badge awarding", () => {
  it("exports an admin action that awards top 10 season badges idempotently", () => {
    const code = source();

    expect(code).toContain("awardBaSCTF2026TopBadges");
    expect(code).toContain("basctf2026-rank-");
    expect(code).toContain(".from('ctf_seasons')");
    expect(code).toContain(".from('ctf_season_participants')");
    expect(code).toContain(".from('user_badges')");
    expect(code).toContain("onConflict: 'user_id,badge_id'");
    expect(code).toContain(".limit(10)");
  });

  it("only awards badges after the BaSCTF2026 season has ended", () => {
    const code = source();

    expect(code).toContain("BaSCTF2026 is not finished yet");
    expect(code).toContain("getEffectiveSeasonStatus(season)");
    expect(code).toContain("!== 'ended'");
  });
});
