import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'kleia.py | Learning Python, one bug at a time',
  description: 'Personal Python and CTF learning journey by a CS student',
  icons: {
    icon: '/logo.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="antialiased">{children}</body>
    </html>
  )
}
