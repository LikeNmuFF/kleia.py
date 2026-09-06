import { redirect } from "next/navigation";

import { isAdmin } from "@/lib/admin";
import PracticeTeamForm from "@/components/practice-teams/PracticeTeamForm";
import PracticeTeamMembers from "@/components/practice-teams/PracticeTeamMembers";
import PracticeTeamSettings from "@/components/practice-teams/PracticeTeamSettings";
import { getAcceptedMemberCount, getPracticeTeamApiKeyMetadata, getPracticeTeamBySlug } from "@/lib/practice-teams/queries";
import { createClient } from "@/lib/supabase/server";

export default async function PracticeTeamSettingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/teams/${slug}/settings`);
  }

  const team = await getPracticeTeamBySlug(supabase, slug);
  if (!team) redirect("/teams");

  if (team.owner_id !== user.id && !(await isAdmin(supabase))) {
    redirect(`/teams/${slug}`);
  }

  const [{ data: members }, memberCount, apiKeys] = await Promise.all([
    supabase
      .from("practice_team_members")
      .select("user_id, role, status, profiles:user_id (username, avatar_url)")
      .eq("team_id", team.id)
      .order("created_at", { ascending: true }),
    getAcceptedMemberCount(supabase, team.id),
    getPracticeTeamApiKeyMetadata(supabase, team.id),
  ]);

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Team settings</h1>
        <p className="mt-2 text-zinc-400">Manage team profile, accepted members, and external streak API access.</p>
      </div>
      <PracticeTeamForm team={team} />
      <PracticeTeamMembers slug={slug} members={members ?? []} />
      <PracticeTeamSettings slug={slug} memberCount={memberCount} apiKeys={apiKeys} />
    </main>
  );
}
