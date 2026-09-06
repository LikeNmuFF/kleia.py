export type PracticeTeamInput = {
  name?: unknown;
  slug?: unknown;
  description?: unknown;
};

export type PracticeTeamValidationResult =
  | {
      ok: true;
      value: {
        name: string;
        slug: string;
        description: string | null;
      };
    }
  | {
      ok: false;
      errors: {
        name?: string;
        slug?: string;
        description?: string;
      };
    };

const MAX_NAME_LENGTH = 80;
const MAX_SLUG_LENGTH = 64;
const MAX_DESCRIPTION_LENGTH = 500;

export function validatePracticeTeamInput(input: PracticeTeamInput): PracticeTeamValidationResult {
  const name = normalizeText(input.name);
  const providedSlug = normalizeText(input.slug);
  const description = normalizeText(input.description);
  const slug = normalizeSlug(providedSlug || name);
  const errors: Record<string, string> = {};

  if (!name) {
    errors.name = "Team name is required";
  } else if (name.length > MAX_NAME_LENGTH) {
    errors.name = "Team name must be 80 characters or fewer";
  }

  if (!slug) {
    errors.slug = "Team slug is required";
  } else if (slug.length > MAX_SLUG_LENGTH) {
    errors.slug = "Team slug must be 64 characters or fewer";
  }

  if (description.length > MAX_DESCRIPTION_LENGTH) {
    errors.description = "Description must be 500 characters or fewer";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      name,
      slug,
      description: description || null,
    },
  };
}

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function normalizeSlug(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SLUG_LENGTH);
}
