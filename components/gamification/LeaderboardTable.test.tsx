import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import LeaderboardTable from "./LeaderboardTable";

describe("LeaderboardTable", () => {
  it("shows the team level badge beside the team name", () => {
    const markup = renderToStaticMarkup(
      <LeaderboardTable
        entries={[
          {
            rank: 1,
            id: "team-1",
            name: "Byte Brigade",
            avatar_url: null,
            xp: 6000,
            level: 7,
            solves: 12,
          },
        ]}
      />,
    );

    expect(markup).toMatch(
      /<div class="flex min-w-0 items-center gap-2"><span class="truncate text-sm text-white">Byte Brigade<\/span><span[^>]*>Level 7<\/span><\/div>/,
    );
  });
});
