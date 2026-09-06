import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export const PRACTICE_TEAM_API_KEY_PREFIX = "kleia_team_";

export function createPracticeTeamApiKey(): { rawKey: string; keyPrefix: string; keyHash: string } {
  const rawKey = `${PRACTICE_TEAM_API_KEY_PREFIX}${randomBytes(32).toString("base64url")}`;
  return {
    rawKey,
    keyPrefix: practiceTeamApiKeyPrefix(rawKey),
    keyHash: hashPracticeTeamApiKey(rawKey),
  };
}

export function practiceTeamApiKeyPrefix(rawKey: string): string {
  return rawKey.slice(0, PRACTICE_TEAM_API_KEY_PREFIX.length + 8);
}

export function hashPracticeTeamApiKey(rawKey: string): string {
  return createHash("sha256").update(rawKey).digest("hex");
}

export function isPracticeTeamApiKeyMatch(candidate: string, expectedHash: string): boolean {
  const actualHash = hashPracticeTeamApiKey(candidate);
  const actual = Buffer.from(actualHash, "hex");
  const expected = Buffer.from(expectedHash, "hex");

  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
