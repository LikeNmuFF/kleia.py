"use client";

import { addPracticeTeamMember, removePracticeTeamMember } from "@/app/actions/practice-teams";

type Member = {
  user_id: string;
  role: string;
  status: string;
  profiles?: { username?: string | null; avatar_url?: string | null } | { username?: string | null; avatar_url?: string | null }[] | null;
};

export default function PracticeTeamMembers({ slug, members }: { slug: string; members: Member[] }) {
  return (
    <section className="space-y-4 rounded-lg border border-white/10 bg-zinc-950 p-5">
      <h2 className="text-lg font-semibold text-white">Members</h2>
      <form action={addMemberAction.bind(null, slug)} className="flex flex-col gap-3 sm:flex-row">
        <input
          name="user_id"
          placeholder="User ID"
          className="flex-1 rounded-md border border-white/10 bg-black px-3 py-2 text-sm text-white"
        />
        <button className="rounded-md bg-zinc-200 px-4 py-2 text-sm font-semibold text-black">Add member</button>
      </form>
      <div className="divide-y divide-white/10">
        {members.map((member) => {
          const profile = Array.isArray(member.profiles) ? member.profiles[0] : member.profiles;
          return (
            <div key={member.user_id} className="flex items-center justify-between gap-3 py-3">
              <div>
                <p className="font-medium text-white">{profile?.username ?? member.user_id}</p>
                <p className="text-xs text-zinc-500">
                  {member.role} · {member.status}
                </p>
              </div>
              {member.role !== "owner" ? (
                <form action={removePracticeTeamMember.bind(null, slug, member.user_id)}>
                  <button className="rounded-md border border-red-500/40 px-3 py-1.5 text-sm text-red-200">Remove</button>
                </form>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

async function addMemberAction(slug: string, formData: FormData) {
  const userId = String(formData.get("user_id") ?? "").trim();
  if (!userId) return;
  await addPracticeTeamMember(slug, userId);
}
