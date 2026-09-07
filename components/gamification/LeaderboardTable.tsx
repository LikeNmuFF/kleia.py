import TeamLevelBadge from "./TeamLevelBadge";
import TeamRepresentativeBadge from "./TeamRepresentativeBadge";

type LeaderboardEntry = {
  rank: number;
  id: string;
  name: string;
  slug?: string;
  avatar_url: string | null;
  xp: number;
  level: number;
  solves: number;
};

export default function LeaderboardTable({ entries }: { entries: LeaderboardEntry[] }) {
  return (
    <div className="rounded-lg border border-white/10 bg-zinc-950">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-zinc-500">
            <th className="px-4 py-3">Rank</th>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3 text-right">XP</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {entries.map((entry) => (
            <tr key={entry.id} className="hover:bg-zinc-900">
              <td className="px-4 py-3 text-sm font-semibold text-white">
                {entry.rank <= 3 ? (
                  <span className={entry.rank === 1 ? "text-yellow-400" : entry.rank === 2 ? "text-zinc-300" : "text-amber-600"}>
                    #{entry.rank}
                  </span>
                ) : (
                  <span className="text-zinc-500">#{entry.rank}</span>
                )}
              </td>
              <td className="px-4 py-3">
                <div className="flex min-w-0 items-center gap-2">
                  {entry.avatar_url ? (
                    <img src={entry.avatar_url} alt="" className="h-6 w-6 rounded-full" />
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-zinc-800" />
                  )}
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-sm text-white">{entry.name}</span>
                    <TeamLevelBadge level={entry.level} />
                    <TeamRepresentativeBadge slug={entry.slug} />
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-right text-sm font-medium text-emerald-400">
                {entry.xp.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
