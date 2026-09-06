import { calculateTeamStreaks, type DailyActivity } from "./streaks";

type SupabaseLike = {
  from: (table: string) => any;
};

export type PracticeTeamSummary = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  avatar_url: string | null;
  owner_id: string;
  created_at: string;
  member_count: number;
  total_solves: number;
  xp: number;
  level: number;
  streaks: {
    current: number;
    longest: number;
  };
};

export type PracticeTeamDetails = PracticeTeamSummary & {
  calendar: DailyActivity[];
};

export type PracticeTeamApiKeyMetadata = {
  id: string;
  team_id: string;
  key_prefix: string;
  created_by: string | null;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
};

export type PracticeTeamRecentSolve = {
  id: string;
  user_id: string;
  challenge_id: string;
  solved_at: string;
  username: string | null;
  avatar_url: string | null;
  title: string;
  category: string | null;
  difficulty: string | null;
  points: number | null;
};

export type PracticeTeamLeaderboardEntry = PracticeTeamSummary;

const TEAM_SELECT = "id, name, slug, description, avatar_url, owner_id, created_at, xp, level";
const KEY_METADATA_SELECT = "id, team_id, key_prefix, created_by, created_at, last_used_at, revoked_at";

export async function getPublicPracticeTeams(supabase: SupabaseLike): Promise<PracticeTeamSummary[]> {
  const { data } = await supabase
    .from("practice_teams")
    .select(TEAM_SELECT)
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  const teams = data ?? [];
  if (teams.length === 0) return [];

  const teamIds = teams.map((t: any) => t.id);

  const [memberCounts, solveCounts, activity] = await Promise.all([
    getBatchMemberCounts(supabase, teamIds),
    getBatchSolveCounts(supabase, teamIds),
    getBatchActivity(supabase, teamIds),
  ]);

  return teams.map((team: any) => {
    const teamActivity = activity.get(team.id) ?? [];
    const streaks = calculateTeamStreaks(teamActivity);

    return {
      ...team,
      member_count: memberCounts.get(team.id) ?? 0,
      total_solves: solveCounts.get(team.id) ?? 0,
      streaks: {
        current: streaks.current,
        longest: streaks.longest,
      },
    };
  });
}

export async function getPracticeTeamBySlug(supabase: SupabaseLike, slug: string): Promise<PracticeTeamDetails | null> {
  const { data } = await supabase
    .from("practice_teams")
    .select(TEAM_SELECT)
    .eq("slug", slug)
    .maybeSingle();

  if (!data) {
    return null;
  }

  const [memberCount, activity, totalSolves] = await Promise.all([
    getAcceptedMemberCount(supabase, data.id),
    getPracticeTeamActivity(supabase, data.id),
    getPracticeTeamSolveCount(supabase, data.id),
  ]);
  const streaks = calculateTeamStreaks(activity);

  return {
    ...data,
    member_count: memberCount,
    total_solves: totalSolves,
    streaks: {
      current: streaks.current,
      longest: streaks.longest,
    },
    calendar: streaks.calendar,
  };
}

export async function getAcceptedMemberCount(supabase: SupabaseLike, teamId: string): Promise<number> {
  const { count } = await supabase
    .from("practice_team_members")
    .select("user_id", { count: "exact", head: true })
    .eq("team_id", teamId)
    .eq("status", "accepted");

  return count ?? 0;
}

export async function getPracticeTeamActivity(supabase: SupabaseLike, teamId: string): Promise<DailyActivity[]> {
  const [{ data: manualActivity }, { data: solves }] = await Promise.all([
    supabase
    .from("practice_team_activity")
    .select("activity_date, count")
    .eq("team_id", teamId)
      .order("activity_date", { ascending: true }),
    supabase
      .from("practice_team_solves")
      .select("solved_at")
      .eq("team_id", teamId),
  ]);

  const countsByDate = new Map<string, number>();

  for (const row of manualActivity ?? []) {
    countsByDate.set(row.activity_date, (countsByDate.get(row.activity_date) ?? 0) + row.count);
  }

  for (const row of solves ?? []) {
    const date = String(row.solved_at).slice(0, 10);
    if (date) {
      countsByDate.set(date, (countsByDate.get(date) ?? 0) + 1);
    }
  }

  return Array.from(countsByDate.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, count]) => ({ date, count }));
}

export async function getPracticeTeamApiKeyMetadata(
  supabase: SupabaseLike,
  teamId: string,
): Promise<PracticeTeamApiKeyMetadata[]> {
  const { data } = await supabase
    .from("practice_team_api_keys")
    .select(KEY_METADATA_SELECT)
    .eq("team_id", teamId)
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function getPracticeTeamRecentSolves(
  supabase: SupabaseLike,
  teamId: string,
  limit = 10,
): Promise<PracticeTeamRecentSolve[]> {
  const { data } = await supabase
    .from("practice_team_solves")
    .select(
      "id, user_id, challenge_id, solved_at, profiles:user_id (username, avatar_url), ctf_challenges:challenge_id (title, category, difficulty, points)",
    )
    .eq("team_id", teamId)
    .order("solved_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((row: any) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    const challenge = Array.isArray(row.ctf_challenges) ? row.ctf_challenges[0] : row.ctf_challenges;

    return {
      id: row.id,
      user_id: row.user_id,
      challenge_id: row.challenge_id,
      solved_at: row.solved_at,
      username: profile?.username ?? null,
      avatar_url: profile?.avatar_url ?? null,
      title: challenge?.title ?? "Deleted challenge",
      category: challenge?.category ?? null,
      difficulty: challenge?.difficulty ?? null,
      points: challenge?.points ?? null,
    };
  });
}

export async function getPracticeTeamLeaderboard(supabase: SupabaseLike): Promise<PracticeTeamLeaderboardEntry[]> {
  const teams = await getPublicPracticeTeams(supabase);

  return teams.sort((left, right) => {
    if (right.total_solves !== left.total_solves) return right.total_solves - left.total_solves;
    if (right.streaks.current !== left.streaks.current) return right.streaks.current - left.streaks.current;
    if (right.streaks.longest !== left.streaks.longest) return right.streaks.longest - left.streaks.longest;
    return left.name.localeCompare(right.name);
  });
}

async function getPracticeTeamSolveCount(supabase: SupabaseLike, teamId: string): Promise<number> {
  const { count } = await supabase
    .from("practice_team_solves")
    .select("id", { count: "exact", head: true })
    .eq("team_id", teamId);

  return count ?? 0;
}

async function getBatchMemberCounts(supabase: SupabaseLike, teamIds: string[]): Promise<Map<string, number>> {
  const { data } = await supabase
    .from("practice_team_members")
    .select("team_id")
    .in("team_id", teamIds)
    .eq("status", "accepted");

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    counts.set(row.team_id, (counts.get(row.team_id) ?? 0) + 1);
  }
  return counts;
}

async function getBatchSolveCounts(supabase: SupabaseLike, teamIds: string[]): Promise<Map<string, number>> {
  const { data } = await supabase
    .from("practice_team_solves")
    .select("team_id")
    .in("team_id", teamIds);

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    counts.set(row.team_id, (counts.get(row.team_id) ?? 0) + 1);
  }
  return counts;
}

async function getBatchActivity(supabase: SupabaseLike, teamIds: string[]): Promise<Map<string, DailyActivity[]>> {
  const [{ data: manualActivity }, { data: solves }] = await Promise.all([
    supabase
      .from("practice_team_activity")
      .select("team_id, activity_date, count")
      .in("team_id", teamIds)
      .order("activity_date", { ascending: true }),
    supabase
      .from("practice_team_solves")
      .select("team_id, solved_at")
      .in("team_id", teamIds),
  ]);

  const activityMap = new Map<string, Map<string, number>>();

  for (const row of manualActivity ?? []) {
    if (!activityMap.has(row.team_id)) activityMap.set(row.team_id, new Map());
    const teamMap = activityMap.get(row.team_id)!;
    teamMap.set(row.activity_date, (teamMap.get(row.activity_date) ?? 0) + row.count);
  }

  for (const row of solves ?? []) {
    const date = String(row.solved_at).slice(0, 10);
    if (date) {
      if (!activityMap.has(row.team_id)) activityMap.set(row.team_id, new Map());
      const teamMap = activityMap.get(row.team_id)!;
      teamMap.set(date, (teamMap.get(date) ?? 0) + 1);
    }
  }

  const result = new Map<string, DailyActivity[]>();
  for (const [teamId, counts] of activityMap) {
    result.set(
      teamId,
      Array.from(counts.entries())
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([date, count]) => ({ date, count })),
    );
  }
  return result;
}
