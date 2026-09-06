"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import { addPracticeTeamMember, removePracticeTeamMember, searchUsersByUsername } from "@/app/actions/practice-teams";

type Member = {
  user_id: string;
  role: string;
  status: string;
  profiles?: { username?: string | null; avatar_url?: string | null } | { username?: string | null; avatar_url?: string | null }[] | null;
};

type SearchResult = {
  id: string;
  username: string;
  avatar_url: string | null;
};

export default function PracticeTeamMembers({ slug, members }: { slug: string; members: Member[] }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SearchResult | null>(null);
  const [adding, setAdding] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearch = useCallback(async (value: string) => {
    setQuery(value);
    setSelectedUser(null);

    if (value.length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    setLoading(true);
    const response = await searchUsersByUsername(value);
    if ("users" in response) {
      setResults(response.users);
      setShowDropdown(response.users.length > 0);
    }
    setLoading(false);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => handleSearch(value), 300);
  };

  const handleSelectUser = (user: SearchResult) => {
    setSelectedUser(user);
    setQuery(user.username);
    setShowDropdown(false);
    setResults([]);
  };

  const handleAdd = async () => {
    if (!selectedUser) return;
    setAdding(true);
    await addPracticeTeamMember(slug, selectedUser.id);
    setQuery("");
    setSelectedUser(null);
    setAdding(false);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <section className="space-y-4 rounded-lg border border-white/10 bg-zinc-950 p-5">
      <h2 className="text-lg font-semibold text-white">Members</h2>
      <div className="flex flex-col gap-3 sm:flex-row" ref={dropdownRef}>
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => results.length > 0 && setShowDropdown(true)}
            placeholder="Search by username..."
            className="w-full rounded-md border border-white/10 bg-black px-3 py-2 text-sm text-white"
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">Searching...</div>
          )}
          {showDropdown && results.length > 0 && (
            <div className="absolute z-10 mt-1 w-full rounded-md border border-white/10 bg-zinc-900 shadow-lg">
              {results.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-white hover:bg-zinc-800"
                >
                  {user.avatar_url ? (
                    <Image src={user.avatar_url} alt="" width={20} height={20} className="rounded-full" />
                  ) : (
                    <div className="h-5 w-5 rounded-full bg-zinc-700" />
                  )}
                  <span>{user.username}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={handleAdd}
          disabled={!selectedUser || adding}
          className="rounded-md bg-zinc-200 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
        >
          {adding ? "Adding..." : "Add member"}
        </button>
      </div>
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
                <form action={removeMemberAction.bind(null, slug, member.user_id)}>
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

async function removeMemberAction(slug: string, userId: string) {
  await removePracticeTeamMember(slug, userId);
}