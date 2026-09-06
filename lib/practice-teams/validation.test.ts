import { describe, expect, it } from "vitest";

import { validatePracticeTeamInput } from "./validation";

describe("practice team validation", () => {
  it("normalizes team names and slugs", () => {
    expect(
      validatePracticeTeamInput({
        name: "  Red Team PH  ",
        slug: " Red Team_PH!! ",
        description: "  Weekend practice crew  ",
      }),
    ).toEqual({
      ok: true,
      value: {
        name: "Red Team PH",
        slug: "red-team-ph",
        description: "Weekend practice crew",
      },
    });
  });

  it("derives a slug from the name when slug is blank", () => {
    expect(
      validatePracticeTeamInput({
        name: "Binary Ninjas",
        slug: "",
        description: "",
      }),
    ).toEqual({
      ok: true,
      value: {
        name: "Binary Ninjas",
        slug: "binary-ninjas",
        description: null,
      },
    });
  });

  it("rejects empty and overlong names", () => {
    expect(validatePracticeTeamInput({ name: "", slug: "", description: "" })).toMatchObject({
      ok: false,
      errors: { name: "Team name is required" },
    });

    expect(validatePracticeTeamInput({ name: "a".repeat(81), slug: "", description: "" })).toMatchObject({
      ok: false,
      errors: { name: "Team name must be 80 characters or fewer" },
    });
  });
});
