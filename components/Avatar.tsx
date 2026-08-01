import Image from 'next/image'

interface AvatarProps {
  src: string | null
  alt?: string
  size?: number
  className?: string
}

export default function Avatar({ src, alt = '', size = 40, className = '' }: AvatarProps) {
  return (
    <div
      className={`rounded-full overflow-hidden flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
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
  )
}
