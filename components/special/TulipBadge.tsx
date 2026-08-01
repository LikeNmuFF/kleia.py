export default function TulipBadge({ className = '' }: { className?: string }) {
  return (
    <img
      src="/tulip.svg"
      alt=""
      className={`inline-block ${className}`}
      width="14"
      height="14"
      style={{ objectFit: 'contain' }}
    />
  )
}
