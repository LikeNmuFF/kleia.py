export default function TeamXPBadge({ xp, level }: { xp: number; level: number }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-zinc-950 px-3 py-2">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-lg font-bold text-emerald-400">
        {level}
      </div>
      <div>
        <p className="text-xs text-zinc-500">Team Level {level}</p>
        <p className="text-lg font-semibold text-white">{xp.toLocaleString()} XP</p>
      </div>
    </div>
  );
}
