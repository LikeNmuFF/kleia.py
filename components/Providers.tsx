'use client'

import { Suspense } from 'react'
import { ThemeProvider } from 'next-themes'
import { LoadingProvider } from '@/lib/context/LoadingContext'
import { RouterLoader } from '@/components/RouterLoader'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <LoadingProvider>
        <Suspense fallback={null}>
          <RouterLoader />
        </Suspense>
        {children}
      </LoadingProvider>
    </ThemeProvider>
  )
}
