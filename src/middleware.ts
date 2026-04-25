import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
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
          // Forward updated cookies onto the request so subsequent getAll()
          // calls within the same middleware invocation see the new values.
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          // Rebuild the response so the refreshed session cookies are sent
          // back to the browser. This is the canonical Supabase SSR pattern.
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: calling getUser() here both validates the JWT with Supabase's
  // servers AND triggers setAll() above so the refreshed session cookie is
  // written back to the browser. Do not replace this with getSession() —
  // getSession() only reads the local cookie and will not refresh it.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Pass through requests that should never be gated.
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/portal') ||
    pathname.startsWith('/auth') ||
    pathname.includes('.')
  ) {
    return supabaseResponse
  }

  // Unauthenticated — send to login.
  if (!user && pathname !== '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    // Preserve all cookies on the redirect response so the browser keeps
    // whatever partial session state it already has.
    const redirectResponse = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach(({ name, value }) => {
      redirectResponse.cookies.set(name, value)
    })
    return redirectResponse
  }

  // Authenticated and already on login — send to dashboard.
  if (user && pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    const redirectResponse = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach(({ name, value }) => {
      redirectResponse.cookies.set(name, value)
    })
    return redirectResponse
  }

  // For all other authenticated requests, return the supabaseResponse so the
  // refreshed session cookie is forwarded to the browser.
  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
