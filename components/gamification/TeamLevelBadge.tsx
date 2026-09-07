export default function TeamLevelBadge({ level }: { level: number }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-xs font-semibold text-emerald-300">
      Level {level}
    </span>
  );
}
