"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getSafeErrorMessage } from "@/lib/errorHandler";
import { shouldGrantBadge } from "@/lib/gamification/badges";
import { getActiveSeason } from "@/lib/gamification/seasons";
import { validateSeasonInput } from "@/lib/gamification/validation";
import { calculateLevel, calculateXpForSolve, calculateStreakBonus } from "@/lib/gamification/xp";
import { getServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { success: true } | { error: string };

export async function awardXp(
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

  for (const teamId of teamIds) {
    const { data: team } = await service
      .from("practice_teams")
      .select("xp")
      .eq("id", teamId)
      .maybeSingle();

    if (team) {
      const newTeamXP = team.xp + totalXp;
      const newTeamLevel = calculateLevel(newTeamXP);
      await service
        .from("practice_teams")
        .update({ xp: newTeamXP, level: newTeamLevel })
        .eq("id", teamId);
    }
  }

  await checkAndGrantBadges(userId, teamIds);

  revalidatePath("/teams");
  revalidatePath("/teams/leaderboard");
  return { success: true };
}

export async function checkAndGrantBadges(
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
