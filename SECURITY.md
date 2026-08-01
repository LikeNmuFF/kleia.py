# Security Policy

Kleia takes the security of the platform and its users seriously. We appreciate your help in reporting vulnerabilities responsibly.

## Supported Versions

The project is in active development (`main` branch). Security fixes are applied to `main` and deployed continuously to https://www.kleia.site. There are no other supported release lines.

| Version | Supported |
|---------|-----------|
| `main` (deployed live) | ✅ |

## Reporting a Vulnerability

**Do not open a public issue for security vulnerabilities.**

Please report them privately instead. To disclose a vulnerability responsibly, email:

**me@kleia.site**

Include the following in your report:

1. A description of the vulnerability and its potential impact.
2. The affected endpoint, page, or component (URL or file path).
3. Steps to reproduce the issue, including any request/response data.
4. Your environment (browser/OS, or tooling used).
5. If you have a suggested fix, include it or describe the approach.

### What happens next

- We will acknowledge your report within **48 hours**.
- We aim to provide an initial assessment and fix timeline within **1 week**.
- We will keep you updated as the issue is investigated and fixed.
- We will credit you for the discovery (unless you prefer to remain anonymous).

## Disclosure Policy

- Please allow us time to fix the issue before you disclose it publicly.
- Once a fix is deployed, we will publish details and credit the reporter.
- We ask that you do not access or modify others' data while investigating.

## Scope

The following are in scope:

- The application at **https://www.kleia.site** and its API endpoints.
- The public repository **github.com/LikeNmuFF/kleia.py** (e.g., supply-chain issues in dependencies).

Out of scope:

- Infrastructure owned by third parties (Vercel, Supabase, Cloudinary, npm registry).
- Social-engineering attacks, denial-of-service against third parties, or physical attacks.

## Safe Harbor

We consider security research conducted in good faith — testing vulnerabilities in the live app without harming users or data — to be authorized. We will not pursue legal action for research that follows this policy. Please do not use automated scanners that could impact availability, and stop testing once you have confirmed a vulnerability.

## Security Practices

- **Row Level Security (RLS)** is enforced on all Supabase tables; server components and API routes never bypass it.
- **Auth** is handled by Supabase Auth; middleware verifies sessions on protected routes.
- **Dependency & static scanning** runs nightly via GitHub Actions (npm audit + Semgrep), with results summarized into the admin security dashboard.
- **Secrets** (Supabase keys, API keys) live only in Vercel/GitHub environment variables and are never committed.
- **Public flags** for CTF challenges are never stored in the repository; seed scripts with plaintext flags are gitignored.
