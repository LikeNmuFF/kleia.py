import Image from 'next/image'
import TulipSVG from './special/TulipSVG'

interface AvatarProps {
  src: string | null
  alt?: string
  size?: number
  className?: string
  isSpecial?: boolean
}

export default function Avatar({ src, alt = '', size = 40, className = '', isSpecial = false }: AvatarProps) {
  const badgeSize = Math.max(size * 0.3, 12)

  return (
    <div className={`relative flex-shrink-0 ${className}`} style={{ width: size, height: size }}>
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
      {isSpecial && (
        <div
          className="absolute -bottom-0.5 -right-0.5 rounded-full flex items-center justify-center"
          style={{
            width: badgeSize + 4,
            height: badgeSize + 4,
            background: '#1e1b4b',
            boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
          }}
        >
          <TulipSVG variant="flower" size={badgeSize} />
        </div>
      )}
    </div>
  )
}
