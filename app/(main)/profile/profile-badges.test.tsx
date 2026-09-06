import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("profile badge display", () => {
  it("maps user_badges badge ids through the static badge catalog", () => {
    const code = readFileSync("app/(main)/profile/page.tsx", "utf8");

    expect(code).toContain("getBadgeById");
    expect(code).toContain("user_badges");
    expect(code).toContain("badgeDefinition?.name");
    expect(code).toContain("badgeDefinition?.description");
  });
});
