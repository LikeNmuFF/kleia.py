"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getSafeErrorMessage } from "@/lib/errorHandler";
import { shouldGrantBadge } from "@/lib/gamification/badges";
import { getActiveSeason } from "@/lib/gamification/seasons";
import { validateSeasonInput } from "@/lib/gamification/validation";
import { calculateLevel, calculateXpForSolve, calculateStreakBonus } from "@/lib/gamification/xp";
import { getDailyMissionsForDate, getTodayString } from "@/lib/utils/gamification";
import { getServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { success: true } | { error: string };

async function awardXp(
  userId: string,
  difficulty: string,
  streakDays: number,
  teamIds: string[],
): Promise<ActionResult> {
  const service = getServiceClient() as any;

  const solveXp = calculateXpForSolve(difficulty);
  const streakBonus = calculateStreakBonus(streakDays);
  const totalXp = solveXp + streakBonus;

  const { data: profile } = await service
    .from("profiles")
    .select("xp")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) return { error: "User not found" };

  const newXP = profile.xp + totalXp;
  const newLevel = calculateLevel(newXP);

  const { error: updateError } = await service
    .from("profiles")
    .update({ xp: newXP, level: newLevel })
    .eq("id", userId);

  if (updateError) return { error: getSafeErrorMessage(updateError, "Could not update XP") };

  if (teamIds.length > 0) {
    const { data: teams } = await service
      .from("practice_teams")
      .select("id, xp")
      .in("id", teamIds);

    const updates = (teams ?? []).map((team: any) => {
      const newTeamXP = team.xp + totalXp;
      return service
        .from("practice_teams")
        .update({ xp: newTeamXP, level: calculateLevel(newTeamXP) })
        .eq("id", team.id);
    });

    await Promise.all(updates);
  }

  await checkAndGrantBadges(userId, teamIds);

  revalidatePath("/teams");
  revalidatePath("/teams/leaderboard");
  return { success: true };
}

async function checkAndGrantBadges(
  userId: string,
  teamIds: string[],
): Promise<void> {
  const service = getServiceClient() as any;

  const { data: profile } = await service
    .from("profiles")
    .select("xp, level")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) return;

  const { count: totalSolves } = await service
    .from("practice_team_solves")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  const { data: existingBadges } = await service
    .from("earned_badges")
    .select("badge_id")
    .eq("user_id", userId);

  const existingBadgeIds = new Set(existingBadges?.map((b: any) => b.badge_id) ?? []);

  const { data: allBadges } = await service
    .from("badges")
    .select("*")
    .eq("type", "user");

  const activeSeason = await getActiveSeason(service);

  for (const badge of allBadges ?? []) {
    if (existingBadgeIds.has(badge.id)) continue;

    if (shouldGrantBadge(badge, { totalSolves: totalSolves ?? 0, level: profile.level })) {
      await service.from("earned_badges").insert({
        user_id: userId,
        badge_id: badge.id,
        season_id: activeSeason?.id ?? null,
      });
    }
  }
}

export async function createSeasonAction(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") return { error: "Unauthorized" };

  const validation = validateSeasonInput({
    name: formData.get("name"),
    starts_at: formData.get("starts_at"),
    ends_at: formData.get("ends_at"),
  });

  if (!validation.ok) {
    return { error: Object.values(validation.errors)[0] ?? "Invalid season data" };
  }

  const service = getServiceClient() as any;

  const { data: activeSeason } = await service
    .from("seasons")
    .select("id")
    .eq("is_active", true)
    .maybeSingle();

  if (activeSeason) {
    return { error: "A season is already active. End it first." };
  }

  const { error } = await service.from("seasons").insert({
    name: validation.value.name,
    starts_at: validation.value.starts_at,
    ends_at: validation.value.ends_at,
    is_active: true,
  });

  if (error) return { error: getSafeErrorMessage(error, "Could not create season") };

  revalidatePath("/teams");
  return { success: true };
}

export async function endSeasonAction(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") return { error: "Unauthorized" };

  const service = getServiceClient() as any;

  const { error } = await service
    .from("seasons")
    .update({ is_active: false })
    .eq("is_active", true);

  if (error) return { error: getSafeErrorMessage(error, "Could not end season") };

  revalidatePath("/teams");
  return { success: true };
}

export async function addXp(
  amount: number,
  reason: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("total_xp")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) return { error: "User not found" };

  const newXp = Math.max(0, (profile.total_xp ?? 0) + amount);
  const newLevel = calculateLevel(newXp);

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ total_xp: newXp, level: newLevel })
    .eq("id", user.id);

  if (updateError) return { error: getSafeErrorMessage(updateError, "Could not update XP") };

  revalidatePath("/profile");
  return { success: true };
}

export async function completeMission(
  missionType: string,
  _completed?: boolean,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const today = getTodayString();

  const { data: existing } = await supabase
    .from("daily_missions")
    .select("id")
    .eq("user_id", user.id)
    .eq("mission_type", missionType)
    .eq("date", today)
    .maybeSingle();

  if (existing) return { success: true };

  const missions = getDailyMissionsForDate(today);
  const mission = missions.find((m) => m.type === missionType);
  if (!mission) return { error: "Unknown mission type" };

  const { error } = await supabase
    .from("daily_missions")
    .insert({
      user_id: user.id,
      mission_type: missionType,
      date: today,
      xp_earned: mission.xpReward,
    });

  if (error) return { error: getSafeErrorMessage(error, "Could not complete mission") };

  return { success: true };
}

export async function checkBadges(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("xp, level")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) return;

  const { count: totalSolves } = await supabase
    .from("practice_team_solves")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const { data: existingBadges } = await supabase
    .from("earned_badges")
    .select("badge_id")
    .eq("user_id", user.id);

  const existingBadgeIds = new Set(existingBadges?.map((b: any) => b.badge_id) ?? []);

  const { data: allBadges } = await supabase
    .from("badges")
    .select("*")
    .eq("type", "user");

  const activeSeason = await getActiveSeason(supabase);

  for (const badge of allBadges ?? []) {
    if (existingBadgeIds.has(badge.id)) continue;

    if (shouldGrantBadge(badge, { totalSolves: totalSolves ?? 0, level: profile.level })) {
      await supabase.from("earned_badges").insert({
        user_id: user.id,
        badge_id: badge.id,
        season_id: activeSeason?.id ?? null,
      });
    }
  }
}

export async function awardFirstLogin(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: existing } = await supabase
    .from("earned_badges")
    .select("id")
    .eq("user_id", user.id)
    .eq("badge_id", "first_login")
    .maybeSingle();

  if (existing) return;

  const { data: badge } = await supabase
    .from("badges")
    .select("id")
    .eq("id", "first_login")
    .maybeSingle();

  if (!badge) return;

  const activeSeason = await getActiveSeason(supabase);

  await supabase.from("earned_badges").insert({
    user_id: user.id,
    badge_id: "first_login",
    season_id: activeSeason?.id ?? null,
  });
}

export async function getDailyMissions(): Promise<
  { id: string; mission_type: string; description: string; xp_reward: number; completed: boolean }[]
> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const today = getTodayString();
  const missions = getDailyMissionsForDate(today);

  const { data: completedMissions } = await supabase
    .from("daily_missions")
    .select("mission_type")
    .eq("user_id", user.id)
    .eq("date", today);

  const completedTypes = new Set(completedMissions?.map((m: any) => m.mission_type) ?? []);

  return missions.map((m) => ({
    id: `${today}-${m.type}`,
    mission_type: m.type,
    description: m.description,
    xp_reward: m.xpReward,
    completed: completedTypes.has(m.type),
  }));
}
