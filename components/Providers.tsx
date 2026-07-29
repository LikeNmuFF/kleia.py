'use client'

import { Suspense, useState } from 'react'
import { ThemeProvider } from 'next-themes'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LoadingProvider } from '@/lib/context/LoadingContext'
import { RouterLoader } from '@/components/RouterLoader'

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <LoadingProvider>
          <Suspense fallback={null}>
            <RouterLoader />
          </Suspense>
          {children}
        </LoadingProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
