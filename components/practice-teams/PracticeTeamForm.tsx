"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { createPracticeTeam, updatePracticeTeam } from "@/app/actions/practice-teams";

type Props = {
  team?: {
    name: string;
    slug: string;
    description: string | null;
  };
};

export default function PracticeTeamForm({ team }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);

    if (team) {
      const result = await updatePracticeTeam(team.slug, formData);
      setIsSubmitting(false);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      router.refresh();
      return;
    }

    const result = await createPracticeTeam(formData);
    setIsSubmitting(false);
    if ("error" in result) {
      setError(result.error);
    } else {
      router.push(`/teams/${result.slug}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border border-white/10 bg-zinc-950 p-5">
      {error ? (
        <p role="alert" className="rounded-md border border-red-500/40 bg-red-950/40 px-3 py-2 text-sm text-red-100">
          {error}
        </p>
      ) : null}
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
      <button
        disabled={isSubmitting}
        className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-black hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
      >
        {isSubmitting ? "Saving..." : team ? "Save team" : "Create team"}
      </button>
    </form>
  );
}
