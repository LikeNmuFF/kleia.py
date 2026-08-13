import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const hasAuthCookie = request.cookies.getAll().some(c => c.name.startsWith('sb-'))

  if (hasAuthCookie) {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      if (request.nextUrl.pathname === '/') {
        const url = request.nextUrl.clone()
        url.pathname = '/feed'
        return NextResponse.redirect(url)
      }
      supabaseResponse.headers.set('x-pathname', request.nextUrl.pathname)
      return supabaseResponse
    }
  }

  const publicPaths = [
    '/',
    '/login',
    '/signup',
    '/verify',
    '/forgot-password',
    '/reset-password',
    '/auth',
    '/security',
    '/privacy',
    '/terms',
    '/api',
  ]

  if (publicPaths.some((p) => request.nextUrl.pathname.startsWith(p))) {
    supabaseResponse.headers.set('x-pathname', request.nextUrl.pathname)
    return supabaseResponse
  }

  const url = request.nextUrl.clone()
  url.pathname = '/login'
  return NextResponse.redirect(url)
}
