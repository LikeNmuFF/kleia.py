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
        <img
          src="/tulip.svg"
          alt=""
          className="absolute -bottom-0.5 -right-0.5 rounded-full"
          width={size * 0.35}
          height={size * 0.35}
          style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))', objectFit: 'contain', background: '#1e1b4b' }}
        />
      )}
    </div>
  )
}
