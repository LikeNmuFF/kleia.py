import Link from "next/link";
import type { Metadata } from "next";

import PracticeTeamGrid from "@/components/practice-teams/PracticeTeamGrid";
import { getPublicPracticeTeams } from "@/lib/practice-teams/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Practice Teams",
  description: "Create CTF practice teams and share GitHub-style activity streaks.",
};

export default async function TeamsPage() {
  const supabase = await createClient();
  const teams = await getPublicPracticeTeams(supabase);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Practice teams</h1>
          <p className="mt-2 max-w-2xl text-zinc-400">
            Track team practice streaks and publish your progress to external pages.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/teams/leaderboard" className="rounded-md border border-white/10 px-4 py-2 text-sm text-zinc-200">
            Leaderboard
          </Link>
          <Link href="/teams/new" className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-black">
            New team
          </Link>
        </div>
      </div>
      <PracticeTeamGrid teams={teams} />
    </main>
  );
}
