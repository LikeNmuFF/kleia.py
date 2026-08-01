interface TulipProps {
  className?: string
  size?: number
  variant?: 'full' | 'flower' | 'petal'
  color?: string
  opacity?: number
}

export default function TulipSVG({
  className = '',
  size,
  variant = 'full',
  color = '#a855f7',
  opacity = 1,
}: TulipProps) {
  const w = size ?? undefined
  const h = size ?? undefined

  if (variant === 'petal') {
    return (
      <svg
        viewBox="0 0 14 18"
        width={w}
        height={h}
        className={className}
        fill="none"
        style={{ opacity }}
      >
        <path
          d="M7 1.5 C4.5 1.5 2.5 4 3 7.5 C3.5 10 5.5 12 7 15 C8.5 12 10.5 10 11 7.5 C11.5 4 9.5 1.5 7 1.5Z"
          fill={color}
        />
      </svg>
    )
  }

  if (variant === 'flower') {
    return (
      <svg
        viewBox="0 0 24 24"
        width={w}
        height={h}
        className={className}
        fill="none"
        style={{ opacity }}
      >
        <path
          d="M12 4 C9 4 6.5 6.5 7 10.5 C7.5 13 9.5 15 12 18 C14.5 15 16.5 13 17 10.5 C17.5 6.5 15 4 12 4Z"
          fill={color}
        />
        <path
          d="M12 4 C10 5.5 8 8.5 8.5 11.5 C9 13.5 10.5 15.5 12 17"
          stroke="white"
          strokeWidth="0.6"
          opacity="0.3"
          fill="none"
        />
        <path
          d="M12 4 C14 5.5 16 8.5 15.5 11.5 C15 13.5 13.5 15.5 12 17"
          stroke="white"
          strokeWidth="0.6"
          opacity="0.2"
          fill="none"
        />
      </svg>
    )
  }

  return (
    <svg
      viewBox="0 0 40 64"
      width={w}
      height={h}
      className={className}
      fill="none"
      style={{ opacity }}
    >
      {/* Flower petals */}
      <path
        d="M20 24 C14 18 6 10 10 3 C14 0 18 4 20 12 C22 4 26 0 30 3 C34 10 26 18 20 24Z"
        fill={color}
      />
      <path
        d="M20 24 C15 19 9 12 12 5 C15 2 18 6 20 13"
        fill="white"
        opacity="0.2"
      />
      <path
        d="M20 24 C25 19 31 12 28 5 C25 2 22 6 20 13"
        fill="white"
        opacity="0.1"
      />
      {/* Stem */}
      <rect x="18.5" y="24" width="3" height="20" rx="1.5" fill="#16a34a" opacity="0.8" />
      {/* Leaves */}
      <path
        d="M20 32 C15 30 10 32 8 36 C10 34 15 33 20 35"
        fill="#22c55e"
        opacity="0.6"
      />
      <path
        d="M20 38 C25 36 30 38 32 42 C30 40 25 39 20 41"
        fill="#22c55e"
        opacity="0.6"
      />
    </svg>
  )
}
