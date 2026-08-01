'use client'

export interface LinkPreviewData {
  url: string
  title: string | null
  description: string | null
  image: string | null
  siteName: string | null
}

export default function LinkPreviewCard({ preview }: { preview: LinkPreviewData }) {
  const hostname = (() => {
    try {
      return new URL(preview.url).hostname.replace('www.', '')
    } catch {
      return preview.url
    }
  })()

  return (
    <a
      href={preview.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block mt-3 rounded-xl overflow-hidden border transition-all hover:scale-[1.01] hover:shadow-lg"
      style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--card-bg)' }}
    >
      {preview.image && (
        <div className="relative w-full h-48 overflow-hidden bg-black/20">
          <img
            src={`/api/image-proxy?url=${encodeURIComponent(preview.image)}`}
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => {
              ;(e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        </div>
      )}
      <div className="p-3">
        <div className="flex items-center gap-1.5 mb-1">
          <svg className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <span className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{hostname}</span>
        </div>
        {preview.title && (
          <p className="font-semibold text-sm leading-snug line-clamp-2" style={{ color: 'var(--text-primary)' }}>
            {preview.title}
          </p>
        )}
        {preview.description && (
          <p className="text-xs mt-1 line-clamp-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {preview.description}
          </p>
        )}
      </div>
    </a>
  )
}
