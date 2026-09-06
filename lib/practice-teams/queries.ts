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

const TEAM_SELECT = "id, name, slug, description, avatar_url, owner_id, created_at";
const KEY_METADATA_SELECT = "id, team_id, key_prefix, created_by, created_at, last_used_at, revoked_at";

export async function getPublicPracticeTeams(supabase: SupabaseLike): Promise<PracticeTeamSummary[]> {
  const { data } = await supabase
    .from("practice_teams")
    .select(TEAM_SELECT)
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  const teams = data ?? [];

  return Promise.all(
    teams.map(async (team: any) => {
      const [memberCount, activity] = await Promise.all([
        getAcceptedMemberCount(supabase, team.id),
        getPracticeTeamActivity(supabase, team.id),
      ]);
      const streaks = calculateTeamStreaks(activity);

      return {
        ...team,
        member_count: memberCount,
        streaks: {
          current: streaks.current,
          longest: streaks.longest,
        },
      };
    }),
  );
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

  const [memberCount, activity] = await Promise.all([
    getAcceptedMemberCount(supabase, data.id),
    getPracticeTeamActivity(supabase, data.id),
  ]);
  const streaks = calculateTeamStreaks(activity);

  return {
    ...data,
    member_count: memberCount,
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
  const { data } = await supabase
    .from("practice_team_activity")
    .select("activity_date, count")
    .eq("team_id", teamId)
    .order("activity_date", { ascending: true });

  return (data ?? []).map((row: any) => ({
    date: row.activity_date,
    count: row.count,
  }));
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
