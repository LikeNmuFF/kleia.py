export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Terms and Conditions</h1>
      <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>Last updated: July 2026</p>

      <div className="prose prose-invert max-w-none space-y-6" style={{ color: 'var(--text-secondary)' }}>
        <h2 className="text-xl font-semibold mt-8" style={{ color: 'var(--text-primary)' }}>1. Acceptance of Terms</h2>
        <p>
          By accessing or using Kleia (&quot;the Platform&quot;), you agree to be bound by these Terms and Conditions. 
          If you do not agree with any part of these terms, you may not use the Platform.
        </p>

        <h2 className="text-xl font-semibold mt-8" style={{ color: 'var(--text-primary)' }}>2. Account Registration</h2>
        <p>To use certain features of the Platform, you must create an account. You agree to:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Provide accurate and complete registration information.</li>
          <li>Keep your account credentials secure and confidential.</li>
          <li>Notify the administrator immediately of any unauthorized use of your account.</li>
          <li>Be responsible for all activity that occurs under your account.</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8" style={{ color: 'var(--text-primary)' }}>3. User Conduct</h2>
        <p>You agree not to use the Platform to:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Post or transmit any content that is unlawful, harmful, threatening, abusive, harassing, defamatory, or otherwise objectionable.</li>
          <li>Impersonate any person or entity, or misrepresent your affiliation with any person or entity.</li>
          <li>Upload or share content that infringes on the intellectual property rights of others.</li>
          <li>Attempt to gain unauthorized access to any part of the Platform, other user accounts, or the underlying systems.</li>
          <li>Use the Platform for any illegal purpose or in violation of any applicable laws.</li>
          <li>Spam, solicit, or advertise without prior authorization.</li>
          <li>Submit automated or bulk queries to the Platform (scraping, crawling, etc.).</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8" style={{ color: 'var(--text-primary)' }}>4. CTF Challenges and Fair Play</h2>
        <p>
          Capture The Flag (CTF) challenges are provided for educational purposes. Participants agree to:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Solve challenges using only the provided web interface and tools.</li>
          <li>Not perform denial-of-service attacks, infrastructure scanning, or other disruptive activities.</li>
          <li>Not share flags or solutions publicly while challenges are active.</li>
          <li>Not create multiple accounts to manipulate the leaderboard.</li>
        </ul>
        <p>
          Violation of these rules may result in disqualification from the leaderboard or account suspension.
        </p>

        <h2 className="text-xl font-semibold mt-8" style={{ color: 'var(--text-primary)' }}>5. Content Ownership</h2>
        <p>
          You retain ownership of the content you post on the Platform. By posting content, you grant Kleia a non-exclusive, 
          royalty-free license to display, distribute, and store your content on the Platform for the purpose of providing the service.
        </p>
        <p>
          You represent and warrant that you own or have the necessary rights to all content you post, and that your content 
          does not violate any third-party rights.
        </p>

        <h2 className="text-xl font-semibold mt-8" style={{ color: 'var(--text-primary)' }}>6. Platform Availability</h2>
        <p>
          Kleia is provided &quot;as is&quot; without warranties of any kind, express or implied. We do not guarantee that 
          the Platform will be available at all times, error-free, or secure. We reserve the right to modify, suspend, 
          or discontinue any part of the Platform at any time without notice.
        </p>

        <h2 className="text-xl font-semibold mt-8" style={{ color: 'var(--text-primary)' }}>7. Limitation of Liability</h2>
        <p>
          Kleia and its contributors shall not be liable for any indirect, incidental, special, consequential, or punitive 
          damages arising out of or related to your use of the Platform. This includes, but is not limited to, loss of data, 
          loss of profits, or interruption of service.
        </p>

        <h2 className="text-xl font-semibold mt-8" style={{ color: 'var(--text-primary)' }}>8. Termination</h2>
        <p>
          We reserve the right to terminate or suspend your account at any time, without prior notice, for conduct that 
          we believe violates these Terms or is harmful to other users, the Platform, or third parties.
        </p>
        <p>
          Upon termination, your right to use the Platform will immediately cease. We may retain certain data as required 
          by law or for legitimate business purposes.
        </p>

        <h2 className="text-xl font-semibold mt-8" style={{ color: 'var(--text-primary)' }}>9. Changes to Terms</h2>
        <p>
          We reserve the right to modify these Terms at any time. Changes will be posted on this page, and the 
          &quot;Last updated&quot; date will be revised. Your continued use of the Platform after changes constitutes 
          acceptance of the new Terms.
        </p>

        <h2 className="text-xl font-semibold mt-8" style={{ color: 'var(--text-primary)' }}>10. Governing Law</h2>
        <p>
          These Terms shall be governed by and construed in accordance with the laws of the Republic of the Philippines. 
          Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts of the Philippines.
        </p>

        <h2 className="text-xl font-semibold mt-8" style={{ color: 'var(--text-primary)' }}>11. Contact</h2>
        <p>
          For questions about these Terms, please contact the project maintainer through the GitHub repository at{' '}
          <a href="https://github.com/LikeNmuFF/kleia.py" className="text-violet-400 hover:text-violet-300" target="_blank" rel="noopener noreferrer">
            github.com/LikeNmuFF/kleia.py
          </a>.
        </p>
      </div>
    </div>
  )
}
