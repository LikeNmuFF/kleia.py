import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = () => readFileSync(join(process.cwd(), "app", "api", "public", "teams", "[slug]", "streaks", "route.ts"), "utf8");

describe("/api/public/teams/[slug]/streaks", () => {
  it("requires bearer auth, service validation, and named rate limiting", () => {
    const code = source();

    expect(code).toContain("authorization");
    expect(code).toContain("Bearer ");
    expect(code).toContain("getServiceClient");
    expect(code).toContain("checkNamedRateLimit");
    expect(code).toContain("practice-team-streak-api");
    expect(code).toContain("rateLimitResponse");
  });

  it("handles missing, unknown, invalid, and revoked key states", () => {
    const code = source();

    expect(code).toContain("status: 401");
    expect(code).toContain("status: 404");
    expect(code).toContain("status: 403");
    expect(code).toContain("revoked_at");
    expect(code).toContain("Invalid API key");
  });

  it("returns safe team, streak, and calendar data without rendering key_hash", () => {
    const code = source();
    const responseStart = code.lastIndexOf("return NextResponse.json({");

    expect(code).toContain("calculateTeamStreaks");
    expect(code).toContain("last_used_at");
    expect(code).toContain("team:");
    expect(code).toContain("streaks:");
    expect(code).toContain("calendar:");
    expect(code.slice(responseStart)).not.toContain("key_hash");
  });
});
