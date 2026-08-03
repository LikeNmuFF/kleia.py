import type { MaterialBlock } from '@/lib/utils/learn'

export default function LessonMaterial({
  material,
}: {
  material: MaterialBlock[]
}) {
  if (!material || material.length === 0) {
    return (
      <div
        className="p-8 rounded-xl text-center"
        style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
      >
        <p style={{ color: 'var(--text-secondary)' }}>
          No reading material for this lesson yet.
        </p>
      </div>
    )
  }

  return (
    <div
      className="rounded-xl p-6 space-y-6"
      style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
    >
      {material.map((block, i) => (
        <section key={i}>
          <h3
            className="text-base font-semibold mb-2 flex items-center gap-2"
            style={{ color: 'var(--text-primary)' }}
          >
            {block.heading}
          </h3>

          {'text' in block && block.text && (
            <p
              className="text-sm leading-relaxed"
              style={{ color: 'var(--text-secondary)' }}
            >
              {block.text}
            </p>
          )}

          {'code' in block && block.code && (
            <pre
              className="p-4 rounded-lg text-sm overflow-x-auto whitespace-pre-wrap"
              style={{
                backgroundColor: 'var(--input-bg)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
              }}
            >
              {block.code}
            </pre>
          )}

          {'bullets' in block && Array.isArray(block.bullets) && (
            <ul className="space-y-2">
              {block.bullets.map((item, j) => (
                <li
                  key={j}
                  className="text-sm flex items-start gap-2"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <span className="mt-0.5 shrink-0" style={{ color: '#7c3aed' }}>
                    ▸
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  )
}
