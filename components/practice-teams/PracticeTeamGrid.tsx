import Link from "next/link";

import type { PracticeTeamSummary } from "@/lib/practice-teams/queries";

export default function PracticeTeamGrid({ teams }: { teams: PracticeTeamSummary[] }) {
  if (teams.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-white/15 p-8 text-center text-zinc-400">
        No teams yet.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {teams.map((team) => (
        <Link
          key={team.id}
          href={`/teams/${team.slug}`}
          className="rounded-lg border border-white/10 bg-zinc-950 p-5 transition hover:border-emerald-400/60"
        >
          <div className="flex items-start gap-3">
            {team.avatar_url ? (
              <img src={team.avatar_url} alt="" className="h-12 w-12 rounded-md object-cover" />
            ) : (
              <div className="grid h-12 w-12 place-items-center rounded-md bg-zinc-800 text-lg font-semibold text-zinc-300">
                {team.name.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="font-semibold text-white">{team.name}</h2>
              <p className="text-sm text-zinc-500">@{team.slug}</p>
            </div>
          </div>
          {team.description ? <p className="mt-4 line-clamp-2 text-sm text-zinc-300">{team.description}</p> : null}
          <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
            <Stat label="members" value={team.member_count} />
            <Stat label="current streak" value={team.streaks.current} />
            <Stat label="longest" value={team.streaks.longest} />
          </div>
        </Link>
      ))}
    </div>
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
