import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("practice team API documentation", () => {
  it("documents server-side usage, auth, errors, and the member prerequisite", () => {
    const doc = readFileSync(join(process.cwd(), "docs", "practice-team-api.md"), "utf8");

    expect(doc).toContain("GET /api/public/teams/[slug]/streaks");
    expect(doc).toContain("Authorization: Bearer");
    expect(doc).toContain("Do not expose this key in browser JavaScript");
    expect(doc).toContain("at least 5 accepted members");
    expect(doc).toContain("401");
    expect(doc).toContain("403");
    expect(doc).toContain("404");
    expect(doc).toContain("429");
  });
});
