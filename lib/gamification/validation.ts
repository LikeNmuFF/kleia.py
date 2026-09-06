type ValidationResult = { ok: true; value: { name: string; starts_at: string; ends_at: string } } | { ok: false; errors: Record<string, string> };

export function validateSeasonInput(input: {
  name: unknown;
  starts_at: unknown;
  ends_at: unknown;
}): ValidationResult {
  const errors: Record<string, string> = {};

  const name = String(input.name ?? "").trim();
  if (!name) errors.name = "Name is required";
  if (name.length > 100) errors.name = "Name must be 100 characters or less";

  const starts_at = String(input.starts_at ?? "");
  const ends_at = String(input.ends_at ?? "");
  if (!starts_at) errors.starts_at = "Start date is required";
  if (!ends_at) errors.end_at = "End date is required";

  if (starts_at && ends_at && new Date(ends_at) <= new Date(starts_at)) {
    errors.dates = "End date must be after start date";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, value: { name, starts_at, ends_at } };
}
