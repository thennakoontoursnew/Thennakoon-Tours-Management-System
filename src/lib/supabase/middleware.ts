import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
    }
  )

  // Get current user session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isDashboardRoute = pathname.startsWith('/dashboard')
  const isAuthRoute = ['/login', '/forgot-password', '/reset-password'].includes(pathname)

  if (isDashboardRoute) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Verify profile is active
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('is_active, role')
      .eq('id', user.id)
      .single()

    if (error || !profile || !profile.is_active) {
      // Sign out on backend and redirect
      const redirectResponse = NextResponse.redirect(
        new URL('/login?error=unauthorized', request.url)
      )
      // Clear session cookies
      redirectResponse.cookies.delete('sb-access-token')
      redirectResponse.cookies.delete('sb-refresh-token')
      return redirectResponse
    }

    // Role-based route protection
    
    // 1. Owner-only: Users, Settings
    if (pathname.startsWith('/dashboard/users') || pathname.startsWith('/dashboard/settings')) {
      if (profile.role !== 'owner') {
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }
    }

    // 2. Sales / CRM & Finance Staff only: Invoices, Receipts, Expenses, Bookings, Customers, Quotations
    if (pathname.startsWith('/dashboard/invoices') || pathname.startsWith('/dashboard/receipts') || pathname.startsWith('/dashboard/expenses')) {
      const allowedRoles = ['owner', 'manager', 'booking_staff', 'finance_staff']
      if (!allowedRoles.includes(profile.role)) {
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }
    }

    // 3. Operations only: Vehicles, Drivers, Fleet, Maintenance
    if (pathname.startsWith('/dashboard/vehicles') || pathname.startsWith('/dashboard/drivers') || pathname.startsWith('/dashboard/fleet') || pathname.startsWith('/dashboard/maintenance')) {
      const allowedRoles = ['owner', 'manager', 'operations_staff']
      if (!allowedRoles.includes(profile.role)) {
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }
    }

    // 4. Marketing only: Marketing
    if (pathname.startsWith('/dashboard/marketing') || pathname.startsWith('/dashboard/ai-tools')) {
      const allowedRoles = ['owner', 'marketing_staff']
      if (!allowedRoles.includes(profile.role)) {
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }
    }
  }

  if (isAuthRoute) {
    if (user) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return supabaseResponse
}
