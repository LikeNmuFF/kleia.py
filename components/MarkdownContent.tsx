'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'

export default function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="markdown-body text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-xl font-bold mt-4 mb-2 first:mt-0" style={{ color: 'var(--text-primary)' }}>{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-bold mt-4 mb-2 first:mt-0" style={{ color: 'var(--text-primary)' }}>{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold mt-3 mb-1 first:mt-0" style={{ color: 'var(--text-primary)' }}>{children}</h3>
          ),
          p: ({ children }) => <p className="my-2">{children}</p>,
          ul: ({ children }) => <ul className="list-disc pl-5 my-2 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 my-2 space-y-1">{children}</ol>,
          li: ({ children }) => <li>{children}</li>,
          strong: ({ children }) => <strong className="font-semibold" style={{ color: 'var(--text-primary)' }}>{children}</strong>,
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: '#7c3aed' }}>
              {children}
            </a>
          ),
          code: (props) => {
            const { className, children, ...rest } = props
            const isBlock = className || String(children).includes('\n')
            if (isBlock) {
              return (
                <pre
                  className="p-3 rounded-lg my-2 text-sm overflow-x-auto whitespace-pre-wrap"
                  style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                >
                  <code className={className} {...rest}>{children}</code>
                </pre>
              )
            }
            return (
              <code
                className="px-1.5 py-0.5 rounded font-mono text-xs"
                style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#eab308' }}
                {...rest}
              >
                {children}
              </code>
            )
          },
          table: ({ children }) => (
            <div className="my-2 overflow-x-auto">
              <table className="w-full text-sm border-collapse">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border px-2 py-1 text-left font-semibold" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>{children}</th>
          ),
          td: ({ children }) => (
            <td className="border px-2 py-1" style={{ borderColor: 'var(--border-color)' }}>{children}</td>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-2 pl-3 border-l-4 text-sm" style={{ borderColor: '#7c3aed', color: 'var(--text-muted)' }}>
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-3" style={{ borderColor: 'var(--border-color)' }} />,
          img: ({ src, alt }) => (
            <img src={src} alt={alt} className="max-w-full rounded-lg my-2" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}