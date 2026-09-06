"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isAdmin } from "@/lib/admin";
import { getSafeErrorMessage } from "@/lib/errorHandler";
import { createPracticeTeamApiKey } from "@/lib/practice-teams/api-keys";
import { uploadPracticeTeamAvatar } from "@/lib/practice-teams/avatar-upload";
import { getAcceptedMemberCount } from "@/lib/practice-teams/queries";
import { validatePracticeTeamInput } from "@/lib/practice-teams/validation";
import { getServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { success: true } | { error: string };
type TeamManager = { supabase: Awaited<ReturnType<typeof createClient>>; team: { id: string; slug: string; owner_id: string } };

export async function createPracticeTeam(formData: FormData): Promise<{ slug: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/teams/new");
  }

  const validation = validatePracticeTeamInput({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
  });

  if (!validation.ok) {
    return { error: Object.values(validation.errors)[0] ?? "Invalid team data" };
  }

  const avatar = formData.get("avatar");
  let avatarUrl: string | null = null;
  if (avatar instanceof File && avatar.size > 0) {
    const uploaded = await uploadPracticeTeamAvatar(avatar);
    avatarUrl = uploaded.secureUrl;
  }

  const service = getServiceClient() as any;
  const { data: team, error } = await service
    .from("practice_teams")
    .insert({
      ...validation.value,
      avatar_url: avatarUrl,
      owner_id: user.id,
      is_public: true,
    })
    .select("id, slug")
    .single();

  if (error) {
    return { error: duplicateError(error) ?? getSafeErrorMessage(error, "Could not create team") };
  }

  const { error: memberError } = await service.from("practice_team_members").insert({
    team_id: team.id,
    user_id: user.id,
    role: "owner",
    status: "accepted",
    invited_by: user.id,
    joined_at: new Date().toISOString(),
  });

  if (memberError) {
    await service.from("practice_teams").delete().eq("id", team.id);
    return { error: getSafeErrorMessage(memberError, "Could not create owner membership") };
  }

  revalidatePath("/teams");
  revalidatePath(`/teams/${team.slug}`);
  return { slug: team.slug };
}

export async function updatePracticeTeam(slug: string, formData: FormData): Promise<ActionResult> {
  const manager = await requireTeamManager(slug);
  if ("error" in manager) return manager;

  const validation = validatePracticeTeamInput({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
  });
  if (!validation.ok) {
    return { error: Object.values(validation.errors)[0] ?? "Invalid team data" };
  }

  const updates: Record<string, unknown> = { ...validation.value };
  const avatar = formData.get("avatar");
  if (avatar instanceof File && avatar.size > 0) {
    const uploaded = await uploadPracticeTeamAvatar(avatar);
    updates.avatar_url = uploaded.secureUrl;
  }

  const { error } = await manager.supabase.from("practice_teams").update(updates).eq("id", manager.team.id);
  if (error) return { error: duplicateError(error) ?? getSafeErrorMessage(error, "Could not update team") };

  revalidateTeamPaths(slug, validation.value.slug);
  return { success: true };
}

export async function addPracticeTeamMember(slug: string, userId: string): Promise<ActionResult> {
  const manager = await requireTeamManager(slug);
  if ("error" in manager) return manager;

  const { error } = await manager.supabase.from("practice_team_members").insert({
    team_id: manager.team.id,
    user_id: userId,
    role: "member",
    status: "accepted",
    invited_by: manager.team.owner_id,
    joined_at: new Date().toISOString(),
  });

  if (error) return { error: duplicateError(error) ?? getSafeErrorMessage(error, "Could not add member") };

  revalidatePath(`/teams/${slug}`);
  revalidatePath(`/teams/${slug}/settings`);
  return { success: true };
}

export async function removePracticeTeamMember(slug: string, userId: string): Promise<ActionResult> {
  const manager = await requireTeamManager(slug);
  if ("error" in manager) return manager;
  if (userId === manager.team.owner_id) return { error: "Cannot remove the team owner" };

  const { error } = await manager.supabase
    .from("practice_team_members")
    .delete()
    .eq("team_id", manager.team.id)
    .eq("user_id", userId)
    .neq("role", "owner");

  if (error) return { error: getSafeErrorMessage(error, "Could not remove member") };

  revalidatePath(`/teams/${slug}`);
  revalidatePath(`/teams/${slug}/settings`);
  return { success: true };
}

export async function recordPracticeTeamActivity(slug: string, date: string, count: number): Promise<ActionResult> {
  const manager = await requireTeamManager(slug);
  if ("error" in manager) return manager;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isInteger(count) || count < 1) {
    return { error: "Invalid activity" };
  }

  const { error } = await (getServiceClient() as any).from("practice_team_activity").upsert(
    {
      team_id: manager.team.id,
      activity_date: date,
      source: "manual",
      count,
      created_by: manager.team.owner_id,
    },
    { onConflict: "team_id,activity_date,source" },
  );

  if (error) return { error: getSafeErrorMessage(error, "Could not record activity") };
  revalidatePath(`/teams/${slug}`);
  return { success: true };
}

export async function generatePracticeTeamApiKey(slug: string): Promise<{ rawKey: string; keyPrefix: string } | { error: string }> {
  const manager = await requireTeamManager(slug);
  if ("error" in manager) return manager;

  const acceptedMemberCount = await getAcceptedMemberCount(manager.supabase, manager.team.id);
  if (acceptedMemberCount < 5) {
    return { error: "Team needs at least 5 accepted members before generating an API key" };
  }

  const key = createPracticeTeamApiKey();
  const { error } = await (getServiceClient() as any).from("practice_team_api_keys").insert({
    team_id: manager.team.id,
    key_prefix: key.keyPrefix,
    key_hash: key.keyHash,
    created_by: manager.team.owner_id,
  });

  if (error) return { error: getSafeErrorMessage(error, "Could not generate API key") };

  revalidatePath(`/teams/${slug}/settings`);
  return { rawKey: key.rawKey, keyPrefix: key.keyPrefix };
}

export async function revokePracticeTeamApiKey(slug: string, keyId: string): Promise<ActionResult> {
  const manager = await requireTeamManager(slug);
  if ("error" in manager) return manager;

  const { error } = await (getServiceClient() as any)
    .from("practice_team_api_keys")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", keyId)
    .eq("team_id", manager.team.id);

  if (error) return { error: getSafeErrorMessage(error, "Could not revoke API key") };

  revalidatePath(`/teams/${slug}/settings`);
  return { success: true };
}

async function requireTeamManager(slug: string): Promise<TeamManager | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not logged in" };

  const { data: team } = await supabase.from("practice_teams").select("id, slug, owner_id").eq("slug", slug).maybeSingle();
  if (!team) return { error: "Team not found" };

  if (team.owner_id !== user.id && !(await isAdmin(supabase))) {
    return { error: "Unauthorized" };
  }

  return { supabase, team };
}

function revalidateTeamPaths(oldSlug: string, newSlug = oldSlug) {
  revalidatePath("/teams");
  revalidatePath(`/teams/${oldSlug}`);
  revalidatePath(`/teams/${oldSlug}/settings`);
  revalidatePath(`/teams/${newSlug}`);
  revalidatePath(`/teams/${newSlug}/settings`);
}

function duplicateError(error: { message?: string }): string | null {
  return error.message?.includes("duplicate key") ? "Team slug is already taken" : null;
}
