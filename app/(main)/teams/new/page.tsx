import { redirect } from "next/navigation";

import PracticeTeamForm from "@/components/practice-teams/PracticeTeamForm";
import { createClient } from "@/lib/supabase/server";

export default async function NewPracticeTeamPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/teams/new");
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-bold text-white">Create practice team</h1>
      <p className="mt-2 text-zinc-400">Start a public team profile and invite at least five accepted members to enable the streak API.</p>
      <div className="mt-6">
        <PracticeTeamForm />
      </div>
    </main>
  );
}
