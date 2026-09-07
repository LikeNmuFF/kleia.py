import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import PracticeTeamGrid from "./PracticeTeamGrid";

describe("PracticeTeamGrid", () => {
  it("shows the team level badge beside the team name", () => {
    const markup = renderToStaticMarkup(
      <PracticeTeamGrid
        teams={[
          {
            id: "team-1",
            name: "Byte Brigade",
            slug: "byte-brigade",
            description: null,
            avatar_url: null,
            owner_id: "owner-1",
            created_at: "2026-09-07T00:00:00.000Z",
            member_count: 6,
            total_solves: 12,
            xp: 6000,
            level: 7,
            streaks: { current: 4, longest: 9 },
          },
        ]}
      />,
    );

    expect(markup).toMatch(
      /<h2 class="flex min-w-0 items-center gap-2 font-semibold text-white"><span class="truncate">Byte Brigade<\/span><span[^>]*>Level 7<\/span><\/h2>/,
    );
  });
});
