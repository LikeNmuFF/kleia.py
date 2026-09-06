import type { DailyActivity } from "@/lib/practice-teams/streaks";

type Props = {
  calendar: DailyActivity[];
  current: number;
  longest: number;
};

export default function PracticeTeamCalendar({ calendar, current, longest }: Props) {
  return (
    <section className="rounded-lg border border-white/10 bg-zinc-950 p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Practice streak</h2>
          <p className="text-sm text-zinc-400">
            {current} current streak · {longest} longest
          </p>
        </div>
        <div className="flex items-center gap-1 text-xs text-zinc-500">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <span key={level} className={`h-3 w-3 rounded-sm ${intensityClass(level)}`} />
          ))}
          <span>More</span>
        </div>
      </div>
      <div className="grid grid-cols-[repeat(53,minmax(0,1fr))] gap-1 overflow-x-auto pb-2">
        {calendar.map((day) => (
          <span
            key={day.date}
            aria-label={`${day.date}: ${day.count} practice activities`}
            className={`h-3 w-3 rounded-sm ${intensityClass(day.count)}`}
            title={`${day.date}: ${day.count}`}
          />
        ))}
      </div>
    </section>
  );
}

function intensityClass(count: number): string {
  if (count <= 0) return "bg-zinc-800";
  if (count === 1) return "bg-emerald-900";
  if (count <= 3) return "bg-emerald-700";
  if (count <= 6) return "bg-emerald-500";
  return "bg-emerald-300";
}
