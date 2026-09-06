import { describe, expect, it } from "vitest";

import {
  createPracticeTeamApiKey,
  hashPracticeTeamApiKey,
  isPracticeTeamApiKeyMatch,
  practiceTeamApiKeyPrefix,
} from "./api-keys";

describe("practice team API keys", () => {
  it("generates a raw key with a non-secret display prefix", () => {
    const first = createPracticeTeamApiKey();
    const second = createPracticeTeamApiKey();

    expect(first.rawKey).toMatch(/^kleia_team_[A-Za-z0-9_-]{32,}$/);
    expect(first.keyPrefix).toBe(practiceTeamApiKeyPrefix(first.rawKey));
    expect(first.rawKey).not.toBe(second.rawKey);
  });

  it("hashes keys and compares candidates without returning raw secrets", () => {
    const { rawKey, keyPrefix } = createPracticeTeamApiKey();
    const hash = hashPracticeTeamApiKey(rawKey);

    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hash).not.toContain(rawKey);
    expect(hash).not.toContain(keyPrefix);
    expect(isPracticeTeamApiKeyMatch(rawKey, hash)).toBe(true);
    expect(isPracticeTeamApiKeyMatch(`${rawKey}x`, hash)).toBe(false);
  });
});
