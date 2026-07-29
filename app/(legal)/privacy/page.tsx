export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Privacy Policy</h1>
      <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>Last updated: July 2026</p>

      <div className="prose prose-invert max-w-none space-y-6" style={{ color: 'var(--text-secondary)' }}>
        <h2 className="text-xl font-semibold mt-8" style={{ color: 'var(--text-primary)' }}>1. Information We Collect</h2>
        <p>When you create an account on Kleia, we collect:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Email address</strong> — Used for authentication and account recovery.</li>
          <li><strong>Username</strong> — Your public display name on the platform.</li>
          <li><strong>Avatar</strong> — An optional profile picture you upload.</li>
          <li><strong>Account credentials</strong> — Your password, stored as a SHA-256 hash. We never store plaintext passwords.</li>
        </ul>
        <p>When you use Kleia, we automatically collect:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Content you create</strong> — Posts, comments, chat messages, CTF submissions, and event responses.</li>
          <li><strong>Interaction data</strong> — Likes, conversation memberships, and attendance records.</li>
          <li><strong>Presence information</strong> — Your online/offline status and last active timestamp.</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8" style={{ color: 'var(--text-primary)' }}>2. How We Use Your Information</h2>
        <p>We use your information to:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Provide and maintain the Kleia platform and its features.</li>
          <li>Authenticate your identity and secure your account.</li>
          <li>Display your content and profile to other users.</li>
          <li>Show real-time presence and messaging features.</li>
          <li>Track participation in CTF challenges and leaderboards.</li>
          <li>Detect and prevent abuse, fraud, or policy violations.</li>
          <li>Improve the platform through usage analysis.</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8" style={{ color: 'var(--text-primary)' }}>3. Data Sharing</h2>
        <p>We do not sell your personal information to third parties.</p>
        <p>We share data only with the following service providers necessary for platform operation:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Supabase</strong> — Database and authentication. Your profile, content, and messages are stored in Supabase.</li>
          <li><strong>Cloudinary</strong> — File hosting. Avatar images and uploaded files are stored on Cloudinary.</li>
          <li><strong>Vercel</strong> — Hosting and deployment infrastructure.</li>
        </ul>
        <p>We may disclose your information if required by law or to protect the rights and safety of our users or the public.</p>

        <h2 className="text-xl font-semibold mt-8" style={{ color: 'var(--text-primary)' }}>4. Data Retention</h2>
        <p>
          We retain your account data for as long as your account is active. If you delete your account, we delete your profile data and anonymize your content. 
          Some data may be retained in backups for up to 30 days. Audit logs are retained for 90 days.
        </p>

        <h2 className="text-xl font-semibold mt-8" style={{ color: 'var(--text-primary)' }}>5. Your Rights</h2>
        <p>You have the right to:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Access</strong> — Request a copy of the data we hold about you.</li>
          <li><strong>Correction</strong> — Update or correct your profile information.</li>
          <li><strong>Deletion</strong> — Delete your account and associated data.</li>
          <li><strong>Objection</strong> — Object to the processing of your data for certain purposes.</li>
        </ul>
        <p>To exercise any of these rights, contact the project maintainer.</p>

        <h2 className="text-xl font-semibold mt-8" style={{ color: 'var(--text-primary)' }}>6. Cookies</h2>
        <p>
          Kleia uses HTTP-only session cookies for authentication. These cookies are essential for the platform to function and do not track you across other websites. 
          We do not use analytics cookies or third-party tracking cookies.
        </p>

        <h2 className="text-xl font-semibold mt-8" style={{ color: 'var(--text-primary)' }}>7. Children&apos;s Privacy</h2>
        <p>
          Kleia is not directed at individuals under the age of 13. We do not knowingly collect personal information from children under 13. 
          If we become aware that a child under 13 has provided us with personal information, we will delete it.
        </p>

        <h2 className="text-xl font-semibold mt-8" style={{ color: 'var(--text-primary)' }}>8. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. Changes will be posted on this page, and the &quot;Last updated&quot; date will be revised. 
          Continued use of Kleia after changes constitutes acceptance of the updated policy.
        </p>

        <h2 className="text-xl font-semibold mt-8" style={{ color: 'var(--text-primary)' }}>9. Contact</h2>
        <p>
          If you have questions about this Privacy Policy, please contact the project maintainer through the GitHub repository.
        </p>
      </div>
    </div>
  )
}
