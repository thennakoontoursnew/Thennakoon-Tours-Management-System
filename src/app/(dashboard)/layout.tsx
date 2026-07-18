import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { Navbar } from '@/components/layout/navbar'
import { logout } from '../auth-actions'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // Validate session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user profile details
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, is_active')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) {
    redirect('/login?error=profile_missing')
  }

  if (!profile.is_active) {
    redirect('/login?error=inactive')
  }

  const handleLogoutAction = async () => {
    'use server'
    await logout()
  }

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950">
      {/* Collapsible Sidebar (Hidden on mobile, desktop visible) */}
      <div className="hidden md:block">
        <Sidebar
          role={profile.role}
          fullName={profile.full_name}
          onLogout={handleLogoutAction}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          role={profile.role}
          fullName={profile.full_name}
          onLogout={handleLogoutAction}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
