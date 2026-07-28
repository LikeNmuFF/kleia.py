import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import Providers from '@/components/Providers'

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
  title: {
    default: 'Kleia | Learn Together, Grow Together',
    template: '%s | Kleia',
  },
  description: 'A community platform for study groups and friends. Share resources, track progress with streaks, and stay connected.',
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
    url: 'https://kleia.py',
    siteName: 'Kleia',
    title: 'Kleia | Learn Together, Grow Together',
    description: 'A community platform for study groups and friends. Share resources, track progress with streaks, and stay connected.',
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
    description: 'A community platform for study groups and friends. Share resources, track progress with streaks, and stay connected.',
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
    canonical: 'https://kleia.py',
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
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
