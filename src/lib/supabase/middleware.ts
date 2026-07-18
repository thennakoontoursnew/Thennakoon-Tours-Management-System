import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl

  // 1. Skip static assets, Next.js internal files, and favicon
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Handle missing Vercel environment variables gracefully
  if (!supabaseUrl || !supabaseAnonKey) {
    if (pathname.startsWith('/dashboard')) {
      const redirectUrl = new URL('/login?error=configuration', request.url)
      return NextResponse.redirect(redirectUrl)
    }
    return supabaseResponse
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  // Helper function to create redirect responses while preserving refreshed cookies and preventing self-redirect loops
  const safeRedirect = (destinationPathAndQuery: string, clearSessionCookies = false) => {
    const destinationUrl = new URL(destinationPathAndQuery, request.url)

    // Rule 7 & 8: Compare destination URL with current URL. Never redirect to self.
    if (
      destinationUrl.pathname === request.nextUrl.pathname &&
      destinationUrl.search === request.nextUrl.search
    ) {
      return supabaseResponse
    }

    const redirectResponse = NextResponse.redirect(destinationUrl)

    if (clearSessionCookies) {
      // Delete session cookies to prevent infinite auth loop
      request.cookies.getAll().forEach((cookie) => {
        if (
          cookie.name.includes('sb-') ||
          cookie.name.includes('supabase') ||
          cookie.name.includes('auth-token')
        ) {
          redirectResponse.cookies.delete(cookie.name)
        }
      })
    } else {
      // Preserve set-cookie headers from Supabase SSR refresh
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
      })
    }

    return redirectResponse
  }

  // Get current auth user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isDashboardRoute = pathname.startsWith('/dashboard')
  const isAuthRoute = ['/login', '/forgot-password', '/reset-password'].includes(pathname)
  const isOwnerSetupRoute = pathname === '/owner-setup'
  const isUnauthorizedRoute = pathname === '/unauthorized'
  const hasErrorParam = searchParams.has('error')

  // Rule 6: Never redirect /unauthorized back to /dashboard
  if (isUnauthorizedRoute) {
    return supabaseResponse
  }

  // Handle Public Auth Routes (/login, /forgot-password, /reset-password)
  if (isAuthRoute) {
    // PUBLIC ROUTE RULE: If URL has ?error=... (e.g. /login?error=unauthorized), ALLOW page to render! Do NOT redirect to /dashboard!
    if (hasErrorParam) {
      return supabaseResponse
    }

    // Only redirect plain /login to /dashboard if user exists AND has an active profile
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_active')
        .eq('id', user.id)
        .maybeSingle()

      if (profile && profile.is_active) {
        return safeRedirect('/dashboard')
      } else {
        // Missing or inactive profile -> allow /login to render
        return supabaseResponse
      }
    }

    return supabaseResponse
  }

  // Handle Owner Setup Route
  if (isOwnerSetupRoute) {
    return supabaseResponse
  }

  // Handle Protected Dashboard Routes (/dashboard, /dashboard/*)
  if (isDashboardRoute) {
    // 1. No valid auth user -> redirect to /login
    if (!user) {
      return safeRedirect('/login')
    }

    // Fetch user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_active, role')
      .eq('id', user.id)
      .maybeSingle()

    // 3. Missing profile -> redirect once to /login?error=profile_missing & clear cookies
    if (!profile) {
      return safeRedirect('/login?error=profile_missing', true)
    }

    // 4. Inactive profile -> redirect once to /login?error=inactive & clear cookies
    if (!profile.is_active) {
      return safeRedirect('/login?error=inactive', true)
    }

    // 5. Role-based sub-route authorization
    if (pathname.startsWith('/dashboard/users') || pathname.startsWith('/dashboard/settings')) {
      if (profile.role !== 'owner') {
        return safeRedirect('/unauthorized')
      }
    }

    if (
      pathname.startsWith('/dashboard/invoices') ||
      pathname.startsWith('/dashboard/receipts') ||
      pathname.startsWith('/dashboard/expenses')
    ) {
      const allowed = ['owner', 'manager', 'booking_staff', 'finance_staff']
      if (!allowed.includes(profile.role)) {
        return safeRedirect('/unauthorized')
      }
    }

    if (
      pathname.startsWith('/dashboard/vehicles') ||
      pathname.startsWith('/dashboard/drivers') ||
      pathname.startsWith('/dashboard/fleet') ||
      pathname.startsWith('/dashboard/maintenance')
    ) {
      const allowed = ['owner', 'manager', 'operations_staff']
      if (!allowed.includes(profile.role)) {
        return safeRedirect('/unauthorized')
      }
    }

    if (pathname.startsWith('/dashboard/marketing') || pathname.startsWith('/dashboard/ai-tools')) {
      const allowed = ['owner', 'marketing_staff']
      if (!allowed.includes(profile.role)) {
        return safeRedirect('/unauthorized')
      }
    }
  }

  return supabaseResponse
}
