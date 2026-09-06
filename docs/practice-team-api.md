# Team Streak API

Teams can publish a read-only GitHub-style streak calendar to external landing pages. A team owner or admin can generate an API key only after the team has at least 5 accepted members, counting the owner.

## Endpoint

```http
GET /api/public/teams/[slug]/streaks
Authorization: Bearer kleia_team_xxxxxxxx...
```

Do not expose this key in browser JavaScript. Store it in a server-side environment variable such as `KLEIA_TEAM_STREAK_API_KEY` and call the API from your backend, server component, or build process.

```ts
export async function getTeamStreaks() {
  const response = await fetch("https://your-kleia-site.com/api/public/teams/red-team/streaks", {
    headers: {
      Authorization: `Bearer ${process.env.KLEIA_TEAM_STREAK_API_KEY}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Kleia streak API failed: ${response.status}`);
  }

  return response.json() as Promise<{
    team: {
      id: string;
      name: string;
      slug: string;
      description: string | null;
      avatar_url: string | null;
    };
    streaks: {
      current: number;
      longest: number;
    };
    calendar: Array<{
      date: string;
      count: number;
    }>;
  }>;
}
```

## Calendar Semantics

The API returns the last 365 days ordered oldest to newest. Missing dates are included with `count: 0`. Current streak has no grace period and only counts a consecutive run that ends today. Longest streak is calculated from the same 365-day calendar.

## Error Codes

- `401`: Missing bearer token or invalid API key.
- `403`: API key exists but has been revoked.
- `404`: Team slug does not exist or is not public.
- `429`: Rate limit reached for the key prefix and client IP.

## Rotation And Revocation

Generate a replacement key in `/teams/[slug]/settings`, update the server-side environment variable on the external site, redeploy or restart that site, then revoke the old key from the same settings page. Raw keys are shown once; only a non-secret prefix and hash are stored.
