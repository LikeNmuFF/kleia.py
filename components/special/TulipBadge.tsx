export default function TulipBadge({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className={`inline-block ${className}`}
      width="14"
      height="14"
    >
      <path
        d="M10 3 C7 3 4.5 5.5 5 9 C5.5 11.5 8 13.5 10 16 C12 13.5 14.5 11.5 15 9 C15.5 5.5 13 3 10 3Z"
        fill="#a855f7"
        opacity="0.9"
      />
      <path
        d="M10 3 C8 4.5 6 7 6.5 10 C7 12 9 14 10 15.5"
        stroke="#c084fc"
        strokeWidth="0.4"
        fill="none"
        opacity="0.5"
      />
      <rect x="9.5" y="15" width="1" height="3" rx="0.5" fill="#22c55e" opacity="0.8" />
    </svg>
  )
}
