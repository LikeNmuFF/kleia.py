import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Practice Teams API",
  description: "How to use your team API key to fetch streak and calendar stats.",
};

const ENDPOINT = "/api/public/teams/{slug}/streaks";

const CURL_EXAMPLE = `curl "https://your-domain.com/api/public/teams/byte-bandits/streaks" \\
  -H "Authorization: Bearer kleia_team_YOUR_KEY_HERE"`;

const RESPONSE_EXAMPLE = `{
  "team": {
    "id": "8f1c2a3b-...",
    "name": "Byte Bandits",
    "slug": "byte-bandits",
    "description": "Weekend CTF practice crew",
    "avatar_url": "https://res.cloudinary.com/.../avatar.png"
  },
  "streaks": {
    "current": 12,
    "longest": 34
  },
  "calendar": [
    { "date": "2025-09-07", "count": 0 },
    { "date": "2025-09-08", "count": 3 }
  ]
}`;

const JS_EXAMPLE = `const res = await fetch(
  "https://your-domain.com/api/public/teams/byte-bandits/streaks",
  { headers: { Authorization: \`Bearer \${process.env.KLEIA_TEAM_API_KEY}\` } },
);

if (!res.ok) {
  const { error } = await res.json();
  throw new Error(error);
}

const { team, streaks, calendar } = await res.json();
console.log(\`\${team.name}: \${streaks.current} day streak\`);`;

const PYTHON_EXAMPLE = `import os
import requests

resp = requests.get(
    "https://your-domain.com/api/public/teams/byte-bandits/streaks",
    headers={"Authorization": f"Bearer {os.environ['KLEIA_TEAM_API_KEY']}"},
    timeout=10,
)
resp.raise_for_status()
data = resp.json()
print(f"{data['team']['name']}: {data['streaks']['current']} day streak")`;

export default function PracticeTeamApiDocsPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Practice Teams API</h1>
          <p className="mt-2 max-w-2xl text-zinc-400">
            Pull your team&apos;s streak and calendar stats programmatically — for dashboards,
            Discord bots, or badges.
          </p>
        </div>
        <Link href="/teams" className="rounded-md border border-white/10 px-4 py-2 text-sm text-zinc-200">
          All teams
        </Link>
      </div>

      <div className="space-y-6">
        <Section title="1. Get an API key">
          <ul className="list-disc space-y-1 pl-5 text-sm text-zinc-300">
            <li>
              Go to your team&apos;s <span className="text-white">Settings</span> page (
              <code className="rounded bg-white/10 px-1 font-mono text-xs">/teams/{"{slug}"}/settings</code>).
            </li>
            <li>
              Your team needs <span className="text-white">at least 5 accepted members</span> before the
              generate button unlocks.
            </li>
            <li>
              The raw key is shown <span className="text-white">only once</span> — copy it immediately and
              store it in an environment variable or secrets manager. Kleia stores only a SHA-256 hash and
              cannot recover it.
            </li>
            <li>
              Keys work only for <span className="text-white">public</span> teams and can be revoked at any
              time from Settings.
            </li>
          </ul>
        </Section>

        <Section title="2. Authenticate">
          <p className="text-sm text-zinc-300">
            Send your key as a Bearer token in the <code className="rounded bg-white/10 px-1 font-mono text-xs">Authorization</code> header:
          </p>
          <CodeBlock>{`Authorization: Bearer kleia_team_YOUR_KEY_HERE`}</CodeBlock>
        </Section>

        <Section title="3. Fetch streak & calendar stats">
          <p className="text-sm text-zinc-300">
            <code className="rounded bg-emerald-500/10 px-1.5 py-0.5 font-mono text-xs text-emerald-300">GET</code>{" "}
            <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-xs">{ENDPOINT}</code>
          </p>
          <p className="text-sm text-zinc-300">
            Replace <code className="rounded bg-white/10 px-1 font-mono text-xs">{"{slug}"}</code> with your
            team&apos;s slug (the <code className="rounded bg-white/10 px-1 font-mono text-xs">@handle</code> in its
            URL). The response contains the team profile, current and longest streak, and a{" "}
            <span className="text-white">365-day activity calendar</span> — the same data that powers the
            heatmap on the team page.
          </p>
          <CodeBlock>{CURL_EXAMPLE}</CodeBlock>
          <CodeBlock label="Response · 200 OK">{RESPONSE_EXAMPLE}</CodeBlock>
        </Section>

        <Section title="Response fields">
          <div className="overflow-hidden rounded-lg border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/[0.03] text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Field</th>
                  <th className="px-4 py-2 font-medium">Type</th>
                  <th className="px-4 py-2 font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-zinc-300">
                <Row field="team.name" type="string" desc="Display name of the team." />
                <Row field="team.slug" type="string" desc="URL slug of the team." />
                <Row field="team.description" type="string | null" desc="Team description, if set." />
                <Row field="team.avatar_url" type="string | null" desc="Team avatar image URL, if uploaded." />
                <Row field="streaks.current" type="number" desc="Consecutive active days ending today (0 if today has no activity)." />
                <Row field="streaks.longest" type="number" desc="Longest run of consecutive active days in the calendar window." />
                <Row field="calendar" type="array" desc="Exactly 365 entries, oldest first, ending today (UTC)." />
                <Row field="calendar[].date" type="string" desc="ISO date, YYYY-MM-DD." />
                <Row field="calendar[].count" type="number" desc="Activity count for that day (manual activity + CTF solves)." />
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="Errors">
          <div className="overflow-hidden rounded-lg border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/[0.03] text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Meaning</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-zinc-300">
                <Row field="401" type="" desc="Missing bearer token, or the key doesn't belong to this team." />
                <Row field="403" type="" desc="API key has been revoked." />
                <Row field="404" type="" desc="Team not found — check the slug, or the team is private." />
                <Row field="429" type="" desc="Rate limited. Retry after the seconds given in the Retry-After header." />
              </tbody>
            </table>
          </div>
          <p className="text-sm text-zinc-400">
            Errors are returned as <code className="rounded bg-white/10 px-1 font-mono text-xs">{`{ "error": "message" }`}</code>.
          </p>
        </Section>

        <Section title="Rate limits">
          <p className="text-sm text-zinc-300">
            <span className="text-white">60 requests per minute</span> per key + IP. Exceeding it returns a{" "}
            <code className="rounded bg-white/10 px-1 font-mono text-xs">429</code> with a{" "}
            <code className="rounded bg-white/10 px-1 font-mono text-xs">Retry-After</code> header (seconds).
            Streak data only changes once per day — polling once a minute is more than enough.
          </p>
        </Section>

        <Section title="Code examples">
          <CodeBlock label="JavaScript (Node 18+, fetch)">{JS_EXAMPLE}</CodeBlock>
          <CodeBlock label="Python (requests)">{PYTHON_EXAMPLE}</CodeBlock>
        </Section>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3 rounded-lg border border-white/10 bg-zinc-950 p-5">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      {children}
    </section>
  );
}

function CodeBlock({ label, children }: { label?: string; children: string }) {
  return (
    <div>
      {label ? <p className="mb-1 text-xs uppercase tracking-wide text-zinc-500">{label}</p> : null}
      <pre className="overflow-x-auto rounded-md border border-white/10 bg-black p-3 text-xs leading-relaxed text-zinc-200">
        <code>{children}</code>
      </pre>
    </div>
  );
}

function Row({ field, type, desc }: { field: string; type: string; desc: string }) {
  return (
    <tr>
      <td className="px-4 py-2 font-mono text-xs text-white">{field}</td>
      {type ? <td className="px-4 py-2 font-mono text-xs text-zinc-400">{type}</td> : null}
      <td className="px-4 py-2">{desc}</td>
    </tr>
  );
}
