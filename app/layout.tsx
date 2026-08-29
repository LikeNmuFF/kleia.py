import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import Providers from '@/components/Providers'
import PresenceHeartbeat from '@/components/PresenceHeartbeat'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export const viewport: Viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  metadataBase: new URL('https://www.kleia.site'),
  title: {
    default: 'Kleia | Learn Together, Grow Together',
    template: '%s | Kleia',
  },
  description: 'Kleia — Learn together, grow together. A social study platform for IT and CS students with feeds, chat, events, CTF challenges, and leaderboards.',
  keywords: ['study', 'learning', 'community', 'education', 'streaks', 'productivity'],
  authors: [{ name: 'Kleia' }],
  creator: 'Kleia',
  publisher: 'Kleia',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.kleia.site',
    siteName: 'Kleia',
    title: 'Kleia | Learn Together, Grow Together',
    description: 'Kleia — Learn together, grow together. A social study platform for IT and CS students with feeds, chat, events, CTF challenges, and leaderboards.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Kleia - Learn Together, Grow Together',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kleia | Learn Together, Grow Together',
    description: 'Kleia — Learn together, grow together. A social study platform for IT and CS students with feeds, chat, events, CTF challenges, and leaderboards.',
    images: ['/og-image.png'],
    creator: '@kleia_py',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://www.kleia.site',
  },
  verification: {
    google: 'ZNr8oGp_Aq8A_VgxRYkcGc-WA4jvs1uEDIZ8OrgqiiQ',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth dark" suppressHydrationWarning>
      <body className={`${inter.className} ${jetBrainsMono.variable}`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'Kleia',
              url: 'https://www.kleia.site',
              description: 'A social study platform for IT and CS students with feeds, chat, events, CTF challenges, and leaderboards.',
              potentialAction: {
                '@type': 'SearchAction',
                target: {
                  '@type': 'EntryPoint',
                  urlTemplate: 'https://www.kleia.site/search?q={search_term_string}',
                },
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Kleia',
              url: 'https://www.kleia.site',
              logo: 'https://www.kleia.site/logo.png',
              sameAs: [],
            }),
          }}
        />
        <Providers>
          <PresenceHeartbeat />
          {children}
        </Providers>
      </body>
    </html>
  )
}
