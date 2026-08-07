import { createClient } from '@/lib/supabase/server'
import { SocialClientWrapper } from './social-client-wrapper'

export const metadata = {
  title: 'Social Media — Thennakoon Tours',
}

export default async function SocialMediaPage() {
  const supabase = await createClient()

  const { data: accounts } = await supabase
    .from('social_accounts')
    .select('*')
    .order('created_at', { ascending: true })

  const { data: snapshots } = await supabase
    .from('social_metric_snapshots')
    .select('*')
    .order('metric_date', { ascending: false })

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Social Media Center</h1>
        <p className="text-slate-500 text-xs mt-1">Channel account manager, manual metric logging, and performance snapshots.</p>
      </div>

      <SocialClientWrapper accounts={accounts || []} snapshots={snapshots || []} />
    </div>
  )
}
