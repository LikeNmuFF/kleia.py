import TulipSVG from './TulipSVG'

export default function TulipBadge({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center ${className}`}>
      <TulipSVG variant="flower" size={14} opacity={0.9} />
    </span>
  )
}
