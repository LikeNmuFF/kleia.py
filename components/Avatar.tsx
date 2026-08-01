import Image from 'next/image'

interface AvatarProps {
  src: string | null
  alt?: string
  size?: number
  className?: string
  isSpecial?: boolean
}

export default function Avatar({ src, alt = '', size = 40, className = '', isSpecial = false }: AvatarProps) {
  return (
    <div className={`relative flex-shrink-0 ${className}`} style={{ width: size, height: size }}>
      {/* Purple glow ring for special users */}
      {isSpecial && (
        <div
          className="absolute inset-[-3px] rounded-full animate-spin-slow"
          style={{
            background: 'conic-gradient(from 0deg, #a855f7, #c084fc, #9333ea, #d8b4fe, #a855f7)',
            opacity: 0.7,
          }}
        />
      )}
      <div
        className="relative rounded-full overflow-hidden"
        style={{
          width: size,
          height: size,
          boxShadow: isSpecial ? '0 0 12px rgba(168,85,247,0.35)' : undefined,
        }}
      >
        <Image
          src={src || ''}
          alt={alt}
          width={size}
          height={size}
          unoptimized
          className="rounded-full object-cover"
          style={{ width: '100%', height: '100%' }}
        />
      </div>
      {/* Tulip badge */}
      {isSpecial && (
        <svg
          viewBox="0 0 20 20"
          fill="none"
          className="absolute -bottom-0.5 -right-0.5"
          width={size * 0.35}
          height={size * 0.35}
          style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}
        >
          <circle cx="10" cy="10" r="9" fill="#1e1b4b" />
          <path
            d="M10 4 C7.5 4 5.5 6 6 9 C6.5 11 8.5 13 10 15.5 C11.5 13 13.5 11 14 9 C14.5 6 12.5 4 10 4Z"
            fill="#a855f7"
            opacity="0.9"
          />
          <rect x="9.5" y="14" width="1" height="2.5" rx="0.5" fill="#22c55e" opacity="0.8" />
        </svg>
      )}
    </div>
  )
}
