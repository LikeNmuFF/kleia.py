"use client";

import { useState } from "react";

type Season = {
  id: string;
  name: string;
  is_active: boolean;
};

export default function SeasonSelector({
  seasons,
  activeSeasonId,
  onChange,
}: {
  seasons: Season[];
  activeSeasonId: string | null;
  onChange: (seasonId: string | null) => void;
}) {
  return (
    <select
      value={activeSeasonId ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
      className="rounded-md border border-white/10 bg-black px-3 py-2 text-sm text-white"
    >
      <option value="">All Time</option>
      {seasons.map((season) => (
        <option key={season.id} value={season.id}>
          {season.name} {season.is_active ? "(Active)" : ""}
        </option>
      ))}
    </select>
  );
}
