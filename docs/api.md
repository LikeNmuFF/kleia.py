# Kleia Practice Teams — Public API

The Practice Teams API lets you pull your team's activity calendar and streak stats programmatically — for dashboards, Discord bots, CI badges, or anything else.

## Table of contents

- [Getting an API key](#getting-an-api-key)
- [Authentication](#authentication)
- [Endpoints](#endpoints)
  - [GET /api/public/teams/{slug}/streaks](#get-apipublicteamsslugstreaks)
- [Response schema](#response-schema)
- [Error responses](#error-responses)
- [Rate limits](#rate-limits)
- [Code examples](#code-examples)

---

## Getting an API key

API keys are generated from the **Team Settings** page (`/teams/{slug}/settings`). Requirements:

1. You must be the **team owner** (admins can also generate keys).
2. The team must have **at least 5 accepted members**. The generate button stays disabled until then.
3. The team must be **public** — keys only work against public teams.

Important things to know about keys:

- The raw key is **shown only once** at generation time. Copy it immediately and store it somewhere safe (env var, secrets manager). Kleia only stores a SHA-256 hash — the raw key cannot be recovered later.
- Keys start with the prefix `kleia_team_`, e.g. `kleia_team_Xk9fT2...`.
- A key becomes useless as soon as it is **revoked** from Team Settings. Revocation takes effect immediately.
- Treat keys like passwords. Never commit them to git or expose them in client-side code.

## Authentication

All endpoints use **Bearer token** authentication. Pass your key in the `Authorization` header:

```
Authorization: Bearer kleia_team_YOUR_KEY_HERE
```

Missing, malformed, unknown, or revoked keys return `401` or `403` — see [Error responses](#error-responses).

## Endpoints

### `GET /api/public/teams/{slug}/streaks`

Returns the team's profile, current/longest streaks, and a full 365-day activity calendar (the same data that powers the calendar heatmap on the team page).

**URL parameters**

| Parameter | Type   | Required | Description                          |
| --------- | ------ | -------- | ------------------------------------ |
| `slug`    | string | Yes      | The team's slug (the `@handle` in its URL, e.g. `byte-bandits`). |

**Example request**

```bash
curl "https://your-domain.com/api/public/teams/byte-bandits/streaks" \
  -H "Authorization: Bearer kleia_team_YOUR_KEY_HERE"
```

**Example response** (`200 OK`)

```json
{
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
}
```

## Response schema

| Field                 | Type              | Description                                                                 |
| --------------------- | ----------------- | --------------------------------------------------------------------------- |
| `team.id`             | string (UUID)     | Internal team ID.                                                           |
| `team.name`           | string            | Display name of the team.                                                   |
| `team.slug`           | string            | URL slug of the team.                                                       |
| `team.description`    | string \| null    | Team description, if set.                                                   |
| `team.avatar_url`     | string \| null    | Team avatar image URL, if uploaded.                                         |
| `streaks.current`     | number            | Consecutive days with activity ending **today** (0 if today has no activity). |
| `streaks.longest`     | number            | Longest consecutive run of active days within the calendar window.          |
| `calendar`            | array of objects  | Exactly **365** entries, oldest first, ending today (UTC).                  |
| `calendar[].date`     | string            | ISO date, `YYYY-MM-DD`.                                                     |
| `calendar[].count`    | number            | Activity count for that day (manual activity + CTF solves). `0` = inactive. |

> Note: the "calendar stats" are part of this response — there is no separate `/api/team/calendar` endpoint. Take `calendar` from the streaks response and render it however you like.

## Error responses

All errors use the same shape:

```json
{ "error": "message" }
```

| Status | Error                  | Cause                                                                    |
| ------ | ---------------------- | ------------------------------------------------------------------------ |
| `401`  | `Missing bearer token` | No `Authorization: Bearer ...` header, or the key is empty.              |
| `401`  | `Invalid API key`      | The key doesn't match any key belonging to that team.                    |
| `403`  | `API key revoked`      | The key was valid but has been revoked in Team Settings.                 |
| `404`  | `Team not found`       | No team with that slug, **or** the team is not public.                   |
| `429`  | `Too many requests...` | Rate limit exceeded — see below. Includes a `Retry-After` header (seconds). |

## Rate limits

Requests are limited to **60 requests per minute** per API key + IP combination. When you hit the limit you get a `429` with a `Retry-After` header telling you how many seconds to wait. Polling once a minute is more than enough for streak data — it only changes once per day.

## Code examples

### cURL

```bash
curl -s "https://your-domain.com/api/public/teams/byte-bandits/streaks" \
  -H "Authorization: Bearer $KLEIA_TEAM_API_KEY" | jq '.streaks'
```

### JavaScript (Node 18+, `fetch`)

```javascript
const res = await fetch(
  "https://your-domain.com/api/public/teams/byte-bandits/streaks",
  {
    headers: {
      Authorization: `Bearer ${process.env.KLEIA_TEAM_API_KEY}`,
    },
  },
);

if (!res.ok) {
  if (res.status === 429) {
    const retryAfter = Number(res.headers.get("Retry-After") ?? 60);
    console.warn(`Rate limited, retry in ${retryAfter}s`);
  }
  const { error } = await res.json();
  throw new Error(error);
}

const { team, streaks, calendar } = await res.json();

console.log(`${team.name}: current streak ${streaks.current}, longest ${streaks.longest}`);
const activeDays = calendar.filter((day) => day.count > 0).length;
console.log(`Active on ${activeDays}/365 days`);
```

### Python (`requests`)

```python
import os
import requests

API_KEY = os.environ["KLEIA_TEAM_API_KEY"]
slug = "byte-bandits"

resp = requests.get(
    f"https://your-domain.com/api/public/teams/{slug}/streaks",
    headers={"Authorization": f"Bearer {API_KEY}"},
    timeout=10,
)

if resp.status_code == 429:
    retry_after = int(resp.headers.get("Retry-After", "60"))
    print(f"Rate limited, retry in {retry_after}s")
    resp.raise_for_status()

resp.raise_for_status()
data = resp.json()

print(f"{data['team']['name']}: current streak {data['streaks']['current']}")
active_days = sum(1 for day in data["calendar"] if day["count"] > 0)
print(f"Active on {active_days}/365 days")
```
