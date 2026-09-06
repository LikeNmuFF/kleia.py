type SupabaseLike = {
  from: (table: string) => any;
};

export type UserGamification = {
  user_id: string;
  username: string;
  avatar_url: string | null;
  xp: number;
  level: number;
  total_solves: number;
  current_streak: number;
  badges: { name: string; description: string; icon_url: string | null; earned_at: string }[];
};

export type TeamGamification = {
  team_id: string;
  name: string;
  slug: string;
  avatar_url: string | null;
  xp: number;
  level: number;
  total_solves: number;
  current_streak: number;
  member_count: number;
  badges: { name: string; description: string; icon_url: string | null; earned_at: string }[];
};

export type LeaderboardEntry = {
  rank: number;
  id: string;
  name: string;
  avatar_url: string | null;
  xp: number;
  level: number;
  solves: number;
};

export async function getUserGamification(
  supabase: SupabaseLike,
  userId: string,
): Promise<UserGamification | null> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, xp, level")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) return null;

  const { count: totalSolves } = await supabase
    .from("practice_team_solves")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  const { data: badges } = await supabase
    .from("earned_badges")
    .select("badge:badge_id (name, description, icon_url), earned_at")
    .eq("user_id", userId);

  return {
    user_id: profile.id,
    username: profile.username,
    avatar_url: profile.avatar_url,
    xp: profile.xp,
    level: profile.level,
    total_solves: totalSolves ?? 0,
    current_streak: 0,
    badges: badges?.map((b: any) => ({
      name: b.badge.name,
      description: b.badge.description,
      icon_url: b.badge.icon_url,
      earned_at: b.earned_at,
    })) ?? [],
  };
}

export async function getTeamGamification(
  supabase: SupabaseLike,
  teamId: string,
): Promise<TeamGamification | null> {
  const { data: team } = await supabase
    .from("practice_teams")
    .select("id, name, slug, avatar_url, xp, level")
    .eq("id", teamId)
    .maybeSingle();

  if (!team) return null;

  const { count: memberCount } = await supabase
    .from("practice_team_members")
    .select("*", { count: "exact", head: true })
    .eq("team_id", teamId)
    .eq("status", "accepted");

  const { count: totalSolves } = await supabase
    .from("practice_team_solves")
    .select("*", { count: "exact", head: true })
    .eq("team_id", teamId);

  return {
    team_id: team.id,
    name: team.name,
    slug: team.slug,
    avatar_url: team.avatar_url,
    xp: team.xp,
    level: team.level,
    total_solves: totalSolves ?? 0,
    current_streak: 0,
    member_count: memberCount ?? 0,
    badges: [],
  };
}

export async function getUserLeaderboard(
  supabase: SupabaseLike,
  seasonId?: string,
): Promise<LeaderboardEntry[]> {
  let query = supabase
    .from("profiles")
    .select("id, username, avatar_url, xp, level")
    .order("xp", { ascending: false })
    .limit(50);

  const { data } = await query;
  return (data ?? []).map((profile: any, index: number) => ({
    rank: index + 1,
    id: profile.id,
    name: profile.username,
    avatar_url: profile.avatar_url,
    xp: profile.xp,
    level: profile.level,
    solves: 0,
  }));
}

export async function getTeamLeaderboard(
  supabase: SupabaseLike,
  seasonId?: string,
): Promise<LeaderboardEntry[]> {
  let query = supabase
    .from("practice_teams")
    .select("id, name, slug, avatar_url, xp, level")
    .eq("is_public", true)
    .order("xp", { ascending: false })
    .limit(50);

  const { data } = await query;
  return (data ?? []).map((team: any, index: number) => ({
    rank: index + 1,
    id: team.id,
    name: team.name,
    avatar_url: team.avatar_url,
    xp: team.xp,
    level: team.level,
    solves: 0,
  }));
}
