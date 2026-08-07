import { createClient } from '@/lib/supabase/server'
import { CampaignsClientWrapper } from './campaigns-client-wrapper'

export const metadata = {
  title: 'Campaigns — Thennakoon Tours',
}

export default async function CampaignsPage() {
  const supabase = await createClient()

  const { data: campaigns } = await supabase
    .from('marketing_campaigns')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Marketing Campaigns</h1>
        <p className="text-slate-500 text-xs mt-1">Campaign budget tracking, objective management, and advertising spend ledgers.</p>
      </div>

      <CampaignsClientWrapper campaigns={campaigns || []} />
    </div>
  )
}
