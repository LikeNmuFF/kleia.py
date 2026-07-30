import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Security',
  description: 'Security practices and vulnerability disclosure for Kleia.',
}

export default function SecurityPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Security</h1>
      <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>Last updated: July 2026</p>

      <div className="prose prose-invert max-w-none space-y-6" style={{ color: 'var(--text-secondary)' }}>
        <p>
          Kleia takes the security of your data seriously. This page outlines the security measures we have implemented to protect your information.
        </p>

        <h2 className="text-xl font-semibold mt-8" style={{ color: 'var(--text-primary)' }}>Encryption</h2>
        <p>
          All traffic to and from Kleia is encrypted using TLS 1.3. Passwords are hashed using SHA-256 before being stored in the database — we never store plaintext passwords. Flag values in CTF challenges are also stored as SHA-256 hashes, never in plaintext.
        </p>

        <h2 className="text-xl font-semibold mt-8" style={{ color: 'var(--text-primary)' }}>Database Security</h2>
        <p>
          We use PostgreSQL Row-Level Security (RLS) to enforce data isolation. Every database query is scoped to the authenticated user, meaning users can only access data they own or data explicitly marked as public. Even server-side actions check user permissions before executing.
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Users can only read and write their own profile data.</li>
          <li>Posts and comments are publicly readable but only editable by their authors.</li>
          <li>Private messages are only visible to conversation participants.</li>
          <li>CTF submissions are only visible to the submitting user and administrators.</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8" style={{ color: 'var(--text-primary)' }}>Authentication</h2>
        <p>
          Authentication is handled by Supabase Auth, which provides secure password-based authentication and OAuth (Google, GitHub). Session tokens are HTTP-only cookies, reducing the risk of XSS-based token theft. Email confirmation is required for new accounts.
        </p>

        <h2 className="text-xl font-semibold mt-8" style={{ color: 'var(--text-primary)' }}>Audit Logging</h2>
        <p>
          All server actions (post creation, likes, CTF flag submissions, admin operations) are logged to an internal events table with timestamps. This allows administrators to investigate suspicious activity and diagnose issues. These logs are only accessible to administrators.
        </p>

        <h2 className="text-xl font-semibold mt-8" style={{ color: 'var(--text-primary)' }}>Open Source</h2>
        <p>
          Kleia is open source. The full source code is available on GitHub at{' '}
          <a href="https://github.com/LikeNmuFF/kleia.py" className="text-violet-400 hover:text-violet-300" target="_blank" rel="noopener noreferrer">
            github.com/LikeNmuFF/kleia.py
          </a>.
          This means the code is publicly auditable — anyone can review the security implementations, dependency choices, and data handling practices.
        </p>

        <h2 className="text-xl font-semibold mt-8" style={{ color: 'var(--text-primary)' }}>Third-Party Services</h2>
        <p>
          Kleia uses the following third-party services, each with their own security and compliance certifications:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Supabase</strong> — Database and authentication provider. Data is hosted on AWS infrastructure. SOC 2 compliant.</li>
          <li><strong>Cloudinary</strong> — Image and file hosting for user uploads. SOC 2 compliant.</li>
          <li><strong>Vercel</strong> — Application hosting and deployment.</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8" style={{ color: 'var(--text-primary)' }}>Reporting Vulnerabilities</h2>
        <p>
          If you discover a security vulnerability in Kleia, please report it privately by contacting the project maintainer. Do not disclose vulnerabilities publicly until they have been addressed.
        </p>
      </div>
    </div>
  )
}
