import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { UsersTable } from './users-table'

export const metadata = {
  title: 'User Management — Thennakoon Tours Management System',
}

export default async function UsersPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!callerProfile || callerProfile.role !== 'owner') {
    redirect('/unauthorized')
  }

  // Fetch all profiles for owner
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, is_active, phone, last_login_at, created_at')
    .order('created_at', { ascending: true })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">User Management</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Manage staff accounts, roles, and access permissions.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg text-sm">
          Failed to load users: {error.message}
        </div>
      )}

      <UsersTable profiles={profiles ?? []} currentUserId={user.id} />
    </div>
  )
}
