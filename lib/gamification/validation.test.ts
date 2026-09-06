import { describe, expect, it } from "vitest";
import { validateSeasonInput } from "./validation";

describe("season validation", () => {
  it("validates season input", () => {
    const result = validateSeasonInput({
      name: "Season 1",
      starts_at: "2026-09-01T00:00:00Z",
      ends_at: "2026-12-31T23:59:59Z",
    });
    expect(result.ok).toBe(true);
  });

  it("rejects empty name", () => {
    const result = validateSeasonInput({
      name: "",
      starts_at: "2026-09-01T00:00:00Z",
      ends_at: "2026-12-31T23:59:59Z",
    });
    expect(result.ok).toBe(false);
  });

  it("rejects end before start", () => {
    const result = validateSeasonInput({
      name: "Season 1",
      starts_at: "2026-12-31T00:00:00Z",
      ends_at: "2026-09-01T23:59:59Z",
    });
    expect(result.ok).toBe(false);
  });
});
