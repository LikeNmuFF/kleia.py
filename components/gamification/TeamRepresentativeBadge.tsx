import { Flag } from "lucide-react";

const LABEL = "Cyber Hunt CTF - Team 1 Representative";

export default function TeamRepresentativeBadge({ slug }: { slug?: string }) {
  if (slug !== "cl4ud3x") return null;

  return (
    <span
      tabIndex={0}
      aria-label={LABEL}
      title={LABEL}
      className="group relative inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-amber-400/30 bg-amber-400/10 text-amber-300 outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
    >
      <Flag className="h-4 w-4" aria-hidden="true" />
      <span className="pointer-events-none absolute right-0 top-full z-50 mt-2 hidden w-48 rounded-md border border-white/15 bg-zinc-900 p-2 text-left text-xs font-medium text-white shadow-lg group-hover:block group-focus:block">
        {LABEL}
      </span>
    </span>
  );
}
