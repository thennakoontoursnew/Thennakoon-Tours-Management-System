import { createClient } from '@/lib/supabase/server'
import { OffersClientWrapper } from './offers-client-wrapper'

export const metadata = {
  title: 'Offers & Promotions — Thennakoon Tours',
}

export default async function OffersPage() {
  const supabase = await createClient()

  const { data: offers } = await supabase
    .from('marketing_offers')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Offers & Promotions</h1>
        <p className="text-slate-500 text-xs mt-1">Promo codes, seasonal discount vouchers, and campaign special rates.</p>
      </div>

      <OffersClientWrapper offers={offers || []} />
    </div>
  )
}
