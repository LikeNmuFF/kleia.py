"use client";

import { generatePracticeTeamApiKey, revokePracticeTeamApiKey } from "@/app/actions/practice-teams";
import type { PracticeTeamApiKeyMetadata } from "@/lib/practice-teams/queries";

type Props = {
  slug: string;
  memberCount: number;
  apiKeys: PracticeTeamApiKeyMetadata[];
};

export default function PracticeTeamSettings({ slug, memberCount, apiKeys }: Props) {
  return (
    <section className="space-y-4 rounded-lg border border-white/10 bg-zinc-950 p-5">
      <div>
        <h2 className="text-lg font-semibold text-white">Streak API keys</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Generate keys after your team has at least 5 accepted members. Store the raw key server-side; it is shown once.
        </p>
      </div>
      <form action={generateKeyAction.bind(null, slug)}>
        <button
          disabled={memberCount < 5}
          className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
        >
          {memberCount < 5 ? "Need 5 members" : "Generate API key"}
        </button>
      </form>
      <div className="divide-y divide-white/10">
        {apiKeys.map((key) => (
          <div key={key.id} className="flex items-center justify-between gap-3 py-3">
            <div>
              <p className="font-mono text-sm text-white">{key.key_prefix}...</p>
              <p className="text-xs text-zinc-500">{key.revoked_at ? "Revoked" : "Active"}</p>
            </div>
            {!key.revoked_at ? (
              <form action={revokeKeyAction.bind(null, slug, key.id)}>
                <button className="rounded-md border border-red-500/40 px-3 py-1.5 text-sm text-red-200">Revoke</button>
              </form>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

async function generateKeyAction(slug: string) {
  await generatePracticeTeamApiKey(slug);
}

async function revokeKeyAction(slug: string, keyId: string) {
  await revokePracticeTeamApiKey(slug, keyId);
}
