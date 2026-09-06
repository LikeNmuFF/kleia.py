import Link from "next/link";
import { notFound } from "next/navigation";

import PracticeTeamCalendar from "@/components/practice-teams/PracticeTeamCalendar";
import { getPracticeTeamBySlug } from "@/lib/practice-teams/queries";
import { createClient } from "@/lib/supabase/server";

export default async function PracticeTeamPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const team = await getPracticeTeamBySlug(supabase, slug);

  if (!team) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          {team.avatar_url ? (
            <img src={team.avatar_url} alt="" className="h-16 w-16 rounded-lg object-cover" />
          ) : (
            <div className="grid h-16 w-16 place-items-center rounded-lg bg-zinc-800 text-2xl font-semibold text-zinc-300">
              {team.name.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold text-white">{team.name}</h1>
            <p className="mt-1 text-zinc-500">@{team.slug}</p>
            {team.description ? <p className="mt-3 max-w-2xl text-zinc-300">{team.description}</p> : null}
            <p className="mt-3 text-sm text-zinc-400">{team.member_count} accepted members</p>
          </div>
        </div>
        <Link href={`/teams/${team.slug}/settings`} className="rounded-md border border-white/10 px-4 py-2 text-sm text-zinc-200">
          Settings
        </Link>
      </div>
      <PracticeTeamCalendar calendar={team.calendar} current={team.streaks.current} longest={team.streaks.longest} />
    </main>
  );
}
