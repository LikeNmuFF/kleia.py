import { describe, expect, it } from "vitest";

import { buildActivityCalendar, calculateTeamStreaks } from "./streaks";

describe("practice team streaks", () => {
  it("returns zero streaks and a 365-day calendar for empty history", () => {
    const result = calculateTeamStreaks([], "2026-09-06");

    expect(result.current).toBe(0);
    expect(result.longest).toBe(0);
    expect(result.calendar).toHaveLength(365);
    expect(result.calendar[0]).toEqual({ date: "2025-09-07", count: 0 });
    expect(result.calendar.at(-1)).toEqual({ date: "2026-09-06", count: 0 });
  });

  it("counts a current streak only when the run ends today", () => {
    const result = calculateTeamStreaks(
      [
        { date: "2026-09-04", count: 1 },
        { date: "2026-09-05", count: 2 },
        { date: "2026-09-06", count: 3 },
      ],
      "2026-09-06",
    );

    expect(result.current).toBe(3);
    expect(result.longest).toBe(3);
  });

  it("does not treat a streak ending yesterday as current", () => {
    const result = calculateTeamStreaks(
      [
        { date: "2026-09-03", count: 1 },
        { date: "2026-09-04", count: 1 },
        { date: "2026-09-05", count: 1 },
      ],
      "2026-09-06",
    );

    expect(result.current).toBe(0);
    expect(result.longest).toBe(3);
  });

  it("uses gaps to split the longest run", () => {
    const result = calculateTeamStreaks(
      [
        { date: "2026-09-01", count: 1 },
        { date: "2026-09-02", count: 1 },
        { date: "2026-09-04", count: 1 },
        { date: "2026-09-05", count: 1 },
        { date: "2026-09-06", count: 1 },
      ],
      "2026-09-06",
    );

    expect(result.current).toBe(3);
    expect(result.longest).toBe(3);
  });

  it("aggregates duplicate UTC-normalized dates before calculating", () => {
    const result = calculateTeamStreaks(
      [
        { date: "2026-09-05T23:30:00.000Z", count: 1 },
        { date: "2026-09-05", count: 4 },
        { date: "2026-09-06T00:30:00.000Z", count: 2 },
        { date: "2026-09-04", count: 0 },
      ],
      "2026-09-06",
    );

    expect(result.current).toBe(2);
    expect(result.longest).toBe(2);
    expect(result.calendar.at(-2)).toEqual({ date: "2026-09-05", count: 5 });
    expect(result.calendar.at(-1)).toEqual({ date: "2026-09-06", count: 2 });
  });

  it("builds an oldest-to-newest calendar with zero-count dates", () => {
    const calendar = buildActivityCalendar(
      [
        { date: "2026-09-04", count: 2 },
        { date: "2026-09-06", count: 5 },
      ],
      "2026-09-06",
      4,
    );

    expect(calendar).toEqual([
      { date: "2026-09-03", count: 0 },
      { date: "2026-09-04", count: 2 },
      { date: "2026-09-05", count: 0 },
      { date: "2026-09-06", count: 5 },
    ]);
  });
});
