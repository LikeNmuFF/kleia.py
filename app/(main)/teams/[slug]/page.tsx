import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import PracticeTeamCalendar from "@/components/practice-teams/PracticeTeamCalendar";
import PracticeTeamForm from "@/components/practice-teams/PracticeTeamForm";
import TeamLevelBadge from "@/components/gamification/TeamLevelBadge";
import TeamRepresentativeBadge from "@/components/gamification/TeamRepresentativeBadge";
import { getPracticeTeamBySlug, getPracticeTeamRecentSolves } from "@/lib/practice-teams/queries";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";

export default async function PracticeTeamPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  if (slug === "new") {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login?next=/teams/new");
    }

    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-3xl font-bold text-white">Create team</h1>
        <p className="mt-2 text-zinc-400">Start a public team profile and invite at least five accepted members to enable the streak API.</p>
        <div className="mt-6">
          <PracticeTeamForm />
        </div>
      </main>
    );
  }

  const team = await getPracticeTeamBySlug(supabase, slug);

  if (!team) {
    notFound();
  }

  const recentSolves = await getPracticeTeamRecentSolves(supabase, team.id, 8);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwnerOrAdmin = user && (team.owner_id === user.id || await isAdmin(supabase));

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 max-w-full items-start gap-4">
          {team.avatar_url ? (
            <img src={team.avatar_url} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
          ) : (
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-lg bg-zinc-800 text-2xl font-semibold text-zinc-300">
              {team.name.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <h1 className="truncate text-3xl font-bold text-white" title={team.name}>{team.name}</h1>
              <TeamLevelBadge level={team.level} />
              <TeamRepresentativeBadge slug={team.slug} />
            </div>
            <p className="mt-1 break-all text-zinc-500">@{team.slug}</p>
            {team.description ? <p className="mt-3 max-w-2xl text-zinc-300">{team.description}</p> : null}
            <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
              <Stat label="members" value={team.member_count} />
              <Stat label="solves" value={team.total_solves} />
              <Stat label="current streak" value={team.streaks.current} />
            </div>
            <p className="mt-4 text-sm font-medium text-emerald-300">{team.xp.toLocaleString()} XP</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/teams/leaderboard" className="rounded-md border border-white/10 px-4 py-2 text-sm text-zinc-200">
            Leaderboard
          </Link>
          {isOwnerOrAdmin ? (
            <Link href={`/teams/${team.slug}/settings`} className="rounded-md border border-white/10 px-4 py-2 text-sm text-zinc-200">
              Settings
            </Link>
          ) : null}
        </div>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          <PracticeTeamCalendar calendar={team.calendar} current={team.streaks.current} longest={team.streaks.longest} />
        </div>
        <section className="min-w-0 rounded-lg border border-white/10 bg-zinc-950 p-5">
          <h2 className="text-lg font-semibold text-white">Recent team solves</h2>
          <p className="mt-1 text-sm text-zinc-500">Accepted members automatically credit the team when they solve CTF challenges.</p>
          <div className="mt-4 space-y-3">
            {recentSolves.length === 0 ? (
              <p className="rounded-md border border-dashed border-white/10 p-4 text-sm text-zinc-500">
                No solves credited yet.
              </p>
            ) : (
              recentSolves.map((solve) => (
                <Link
                  key={solve.id}
                  href={`/ctf/${solve.challenge_id}`}
                  className="block rounded-md border border-white/10 bg-black p-3 transition hover:border-emerald-400/60"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">{solve.title}</p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {solve.username ?? "A teammate"} solved · {new Date(solve.solved_at).toLocaleDateString()}
                      </p>
                    </div>
                    {typeof solve.points === "number" ? (
                      <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-300">
                        {solve.points} pts
                      </span>
                    ) : null}
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-lg font-semibold text-white">{value}</div>
      <div className="text-xs uppercase tracking-wide text-zinc-500">{label}</div>
    </div>
  );
}
