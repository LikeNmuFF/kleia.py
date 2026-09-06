"use client";

import { createPracticeTeam, updatePracticeTeam } from "@/app/actions/practice-teams";

type Props = {
  team?: {
    name: string;
    slug: string;
    description: string | null;
  };
};

export default function PracticeTeamForm({ team }: Props) {
  const action = team ? updatePracticeTeam.bind(null, team.slug) : createPracticeTeam;

  return (
    <form action={action} className="space-y-5 rounded-lg border border-white/10 bg-zinc-950 p-5">
      <label className="block">
        <span className="text-sm font-medium text-zinc-200">Name</span>
        <input
          name="name"
          defaultValue={team?.name}
          required
          maxLength={80}
          className="mt-2 w-full rounded-md border border-white/10 bg-black px-3 py-2 text-white"
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-zinc-200">Slug</span>
        <input
          name="slug"
          defaultValue={team?.slug}
          maxLength={64}
          className="mt-2 w-full rounded-md border border-white/10 bg-black px-3 py-2 text-white"
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-zinc-200">Description</span>
        <textarea
          name="description"
          defaultValue={team?.description ?? ""}
          maxLength={500}
          rows={4}
          className="mt-2 w-full rounded-md border border-white/10 bg-black px-3 py-2 text-white"
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-zinc-200">Avatar</span>
        <input
          name="avatar"
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp"
          className="mt-2 w-full rounded-md border border-white/10 bg-black px-3 py-2 text-sm text-zinc-300"
        />
      </label>
      <button className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-black hover:bg-emerald-400">
        {team ? "Save team" : "Create team"}
      </button>
    </form>
  );
}
