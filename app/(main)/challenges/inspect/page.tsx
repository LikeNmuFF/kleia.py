export default function InspectChallengePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-lg text-center">
        <h1 className="text-3xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          Nothing to see here...
        </h1>
        <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
          Or is there? Look closer.
        </p>
      </div>
      {/* 
        Congratulations! You found the hidden flag.
        Flag: KLEIA{v13w_s0urc3_1s_y0ur_fr13nd}
        Submit it on the CTF challenges page to earn your points.
      */}
    </div>
  )
}
