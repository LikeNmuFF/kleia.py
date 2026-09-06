type Badge = {
  name: string;
  description: string;
  icon_url: string | null;
  earned_at: string;
};

export default function BadgeShowcase({ badges }: { badges: Badge[] }) {
  if (badges.length === 0) {
    return (
      <section className="rounded-lg border border-white/10 bg-zinc-950 p-5">
        <h2 className="text-lg font-semibold text-white">Badges</h2>
        <p className="text-sm text-zinc-500">No badges earned yet.</p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-white/10 bg-zinc-950 p-5">
      <h2 className="text-lg font-semibold text-white">Badges ({badges.length})</h2>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {badges.map((badge) => (
          <div
            key={badge.name}
            className="flex flex-col items-center rounded-lg border border-white/10 bg-zinc-900 p-3 text-center"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-2xl">
              {badge.icon_url ? (
                <img src={badge.icon_url} alt="" className="h-8 w-8" />
              ) : (
                <span className="text-emerald-400">★</span>
              )}
            </div>
            <p className="mt-2 text-sm font-medium text-white">{badge.name}</p>
            <p className="text-xs text-zinc-500">{badge.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
