import Link from "next/link";
import type { Metadata } from "next";

import LeaderboardTable from "@/components/gamification/LeaderboardTable";
import { getPracticeTeamLeaderboard } from "@/lib/practice-teams/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Team leaderboard",
  description: "Ranked teams by CTF solves and streak activity.",
};

export default async function PracticeTeamLeaderboardPage() {
  const supabase = await createClient();
  const teams = await getPracticeTeamLeaderboard(supabase);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Team leaderboard</h1>
          <p className="mt-2 max-w-2xl text-zinc-400">
            Teams rank by total solves. Ties use current streak, longest streak, then team name.
          </p>
        </div>
        <Link href="/teams" className="rounded-md border border-white/10 px-4 py-2 text-sm text-zinc-200">
          All teams
        </Link>
      </div>

      {teams.length === 0 ? (
        <div className="overflow-hidden rounded-lg border border-white/10 bg-zinc-950 p-8 text-center text-zinc-500">
          No public teams yet.
        </div>
      ) : (
        <LeaderboardTable
          entries={teams.map((team, index) => ({
            rank: index + 1,
            id: team.id,
            name: team.name,
            slug: team.slug,
            avatar_url: team.avatar_url,
            xp: team.xp,
            level: team.level,
            solves: team.total_solves,
          }))}
        />
      )}
    </main>
  );
}
