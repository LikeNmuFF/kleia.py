import Image from 'next/image'

interface AvatarProps {
  src: string | null
  alt?: string
  size?: number
  className?: string
}

export default function Avatar({ src, alt = '', size = 40, className = '' }: AvatarProps) {
  return (
    <Image
      src={src || ''}
      alt={alt}
      width={size}
      height={size}
      unoptimized
      className={`rounded-full object-cover ${className}`}
    />
  )
}
