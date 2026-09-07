# CTF Prefetch CPU Reduction Design

## Problem

Vercel reports that Kleia used 3 hours 11 minutes of Fluid Active CPU in the current 30-day period. In the latest 12-hour route breakdown, `/ctf` received 872 invocations while `/ctf/[id]` received approximately 6,400. The ratio closely matches the number of challenge cards rendered per CTF-list visit.

Next.js prefetches visible `<Link>` destinations by default. Each challenge destination is an authenticated, dynamic server-rendered page that performs several Supabase queries. Prefetching every challenge therefore runs expensive server work even when the user does not open those challenges.

## Goal

Reduce unnecessary Vercel function invocations and active CPU without changing challenge permissions, solve status, hints, reviews, downloads, or navigation behavior.

## Design

Set `prefetch={false}` on links whose destination is `/ctf/[id]` and which appear in repeated lists. The initial scope is:

- Challenge cards in `app/(main)/ctf/CTFClient.tsx`
- Challenge nodes in `components/ctf/ChallengeGrid.tsx`
- Recent-solve challenge links in `app/(main)/ctf/stats/CTFStatsClient.tsx`
- Challenge links rendered from lesson and team activity views

Normal click navigation remains unchanged. Next.js will request the challenge page only after the user selects it. Static navigation links and one-off destinations remain eligible for normal prefetching.

No server-side caching will be added in this change. The challenge page contains per-user solve and hint state, so caching the complete response risks showing one user's state to another or serving stale authorization-sensitive data. Separating public challenge data from user state may be considered later if disabling speculative requests is insufficient.

## Request Protection

Keep the existing authentication middleware and route behavior. Do not introduce blanket bot blocks on authenticated CTF routes without evidence that automated traffic remains after prefetching is disabled. This avoids false positives for school networks where many users may share an IP address.

## Verification

- Add focused tests asserting repeated challenge links opt out of prefetching.
- Run the relevant CTF tests and the production build.
- After deployment, compare `/ctf/[id]` invocations against `/ctf` visits over at least 24 hours.
- Expected result: `/ctf/[id]` requests should track actual challenge opens instead of multiplying each `/ctf` visit by the number of visible challenges.

## Vercel Account Transfer

Account or team transfer is separate from this optimization. If a transfer is still needed for ownership or billing, preserve the Git repository connection, environment variables, Supabase and Cloudinary secrets, custom domain, and webhook URL. A transfer should not be used as the primary mechanism for resetting usage because the underlying request multiplication would continue on the new account.
