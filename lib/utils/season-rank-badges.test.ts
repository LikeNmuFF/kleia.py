import { describe, expect, it } from "vitest";

import { getBadgeById } from "./gamification";

describe("BaSCTF2026 rank badge catalog", () => {
  it("defines display badges for ranks 1 through 10", () => {
    for (let rank = 1; rank <= 10; rank++) {
      const badge = getBadgeById(`basctf2026-rank-${rank}`);

      expect(badge?.name).toBe(rank === 1 ? "BaSCTF2026 Champion" : `BaSCTF2026 Top ${rank}`);
      expect(badge?.category).toBe("ctf");
      expect(badge?.description).toContain(`rank #${rank}`);
    }
  });
});
