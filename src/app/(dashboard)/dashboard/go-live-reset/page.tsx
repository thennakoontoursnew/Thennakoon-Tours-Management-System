import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getGoLiveResetSummary } from './go-live-reset-actions'
import { GoLiveResetClient } from './go-live-reset-client'

export const dynamic = 'force-dynamic'

export default async function GoLiveResetPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'owner') {
    redirect('/unauthorized')
  }

  const summaryRes = await getGoLiveResetSummary()

  if (!summaryRes.success) {
    return (
      <div className="p-8 text-center text-rose-500 font-bold text-sm">
        {summaryRes.error || 'Failed to load Go Live Reset dashboard.'}
      </div>
    )
  }

  return <GoLiveResetClient summary={summaryRes} />
}
