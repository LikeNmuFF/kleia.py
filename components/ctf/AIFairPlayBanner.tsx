import { GraduationCap } from 'lucide-react'

export default function AIFairPlayBanner() {
  return (
    <div
      className="flex items-start gap-3 p-4 mb-6 rounded-xl border text-sm leading-relaxed"
      style={{
        backgroundColor: 'rgba(139, 92, 246, 0.08)',
        borderColor: 'rgba(139, 92, 246, 0.25)',
        color: 'var(--text-primary)',
      }}
    >
      <GraduationCap className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
      <p>
        <span className="font-semibold">Learn at your own pace.</span>{' '}
        <span className="opacity-90">
          Hack4Gov does not allow AI — train the skills you use here without AI tools so you stay competition-ready.
        </span>
      </p>
    </div>
  )
}
