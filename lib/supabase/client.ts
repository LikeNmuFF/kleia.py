import { createBrowserClient } from '@supabase/ssr'

let client: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (client) return client
  const isProd = process.env.NODE_ENV === 'production'
  const supaFetch: typeof fetch = async (input, init) => {
    const res = await fetch(input as RequestInfo, init as RequestInit)
    // In prod, don't let Supabase JS log 404s with table names + user IDs to console
    // The caller will still get error object, but we suppress the console warning
    if (!res.ok && isProd && typeof input === 'string' && input.includes('/rest/v1/')) {
      // swallow console.error for this fetch by temporarily muting
      const origError = console.error
      console.error = () => {}
      setTimeout(() => { console.error = origError }, 0)
    }
    return res
  }
  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { fetch: supaFetch } as any,
    }
  )
  return client
}
