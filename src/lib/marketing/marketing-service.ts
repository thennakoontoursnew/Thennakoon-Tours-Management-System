import { getColomboTodayString } from '@/lib/utils/colombo-date-utils'

export interface MarketingKPIs {
  activeCampaigns: number
  contentDueToday: number
  scheduledContent: number
  publishedThisMonth: number
  activeOffers: number
  attributedRevenue: number
  totalSpend: number
  roas: string
}

export async function getMarketingOverviewSummary(supabase: any): Promise<MarketingKPIs> {
  const todayStr = getColomboTodayString()

  const [
    { count: activeCampaigns },
    { count: scheduledContent },
    { count: activeOffers },
    { data: contentItems },
    { data: campaigns },
  ] = await Promise.all([
    supabase.from('marketing_campaigns').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('marketing_content').select('id', { count: 'exact', head: true }).eq('status', 'scheduled'),
    supabase.from('marketing_offers').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('marketing_content').select('id, status, planned_publish_at, actual_publish_at'),
    supabase.from('marketing_campaigns').select('id, actual_spend'),
  ])

  let contentDueToday = 0
  let publishedThisMonth = 0

  if (contentItems) {
    contentItems.forEach((item: any) => {
      const planDay = item.planned_publish_at ? item.planned_publish_at.slice(0, 10) : ''
      const pubDay = item.actual_publish_at ? item.actual_publish_at.slice(0, 10) : ''

      if (planDay === todayStr && item.status !== 'published') contentDueToday++
      if (item.status === 'published' && pubDay.slice(0, 7) === todayStr.slice(0, 7)) publishedThisMonth++
    })
  }

  let totalSpend = 0
  if (campaigns) {
    totalSpend = campaigns.reduce((acc: number, c: any) => acc + Number(c.actual_spend || 0), 0)
  }

  // Calculate Attributed Collected Revenue (from completed payments)
  const { data: payments } = await supabase
    .from('payments')
    .select('amount, status')
    .eq('status', 'completed')

  const attributedRevenue = payments
    ? payments.reduce((acc: number, p: any) => acc + Number(p.amount || 0), 0)
    : 0

  const roas = totalSpend > 0 ? (attributedRevenue / totalSpend).toFixed(2) + 'x' : 'N/A'

  return {
    activeCampaigns: activeCampaigns || 0,
    contentDueToday,
    scheduledContent: scheduledContent || 0,
    publishedThisMonth,
    activeOffers: activeOffers || 0,
    attributedRevenue,
    totalSpend,
    roas,
  }
}
