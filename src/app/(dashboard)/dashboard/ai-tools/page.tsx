import { createClient } from '@/lib/supabase/server'
import { getAIProviderConfig } from '@/lib/ai/ai-provider'
import {
  generateDeterministicExecutiveBrief,
  getSanitizedContextForPeriod,
} from '@/lib/ai/management-intelligence-service'
import { calculateDeterministicForecast } from '@/lib/ai/ai-forecast-service'
import { AIToolsClient } from './ai-tools-client'

export const metadata = {
  title: 'AI Management Intelligence — Thennakoon Tours',
}

export default async function Page() {
  const supabase = await createClient()
  const providerConfig = getAIProviderConfig()

  // 1. Fetch Sanitized Context & Comparisons
  const { sanitized, comparisons } = await getSanitizedContextForPeriod(supabase, 'this_month')
  const defaultBrief = generateDeterministicExecutiveBrief(sanitized, comparisons)

  // 2. Fetch Latest Generated Report from DB if present
  const { data: latestReport } = await supabase
    .from('ai_generated_reports')
    .select('*')
    .eq('report_type', 'executive')
    .order('generated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const initialBrief = latestReport?.ai_output || defaultBrief

  // 3. Fetch Insights from DB
  const { data: rawInsights } = await supabase
    .from('ai_insights')
    .select('*')
    .neq('status', 'dismissed')
    .order('created_at', { ascending: false })
    .limit(50)

  const initialInsights = (rawInsights || []).length > 0
    ? rawInsights
    : defaultBrief.recommendedActions

  // 4. Fetch Report History
  const { data: reportHistory } = await supabase
    .from('ai_generated_reports')
    .select('*')
    .order('generated_at', { ascending: false })
    .limit(30)

  // 5. Generate Initial Deterministic Forecasts
  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)
  const d30Ago = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const d7Future = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const d30Future = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const d90Future = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const [paymentsRes, bookingsRes] = await Promise.all([
    supabase.from('payments').select('amount').eq('status', 'completed').gte('payment_date', d30Ago).lte('payment_date', todayStr),
    supabase.from('bookings').select('id, grand_total, rental_start_at, status').eq('is_archived', false),
  ])

  const payments = paymentsRes.data || []
  const bookings = bookingsRes.data || []

  const historicalCompletedRevenue = payments.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0)
  const completedRentalsCount = bookings.filter((b: any) => b.status === 'closed' || b.status === 'completed').length
  const totalBookingsCount = bookings.length

  const future7dRev = bookings
    .filter((b: any) => ['confirmed', 'ready', 'in_progress'].includes(b.status) && b.rental_start_at && b.rental_start_at.slice(0, 10) <= d7Future)
    .reduce((sum: number, b: any) => sum + Number(b.grand_total || 0), 0)

  const future30dRev = bookings
    .filter((b: any) => ['confirmed', 'ready', 'in_progress'].includes(b.status) && b.rental_start_at && b.rental_start_at.slice(0, 10) <= d30Future)
    .reduce((sum: number, b: any) => sum + Number(b.grand_total || 0), 0)

  const future90dRev = bookings
    .filter((b: any) => ['confirmed', 'ready', 'in_progress'].includes(b.status) && b.rental_start_at && b.rental_start_at.slice(0, 10) <= d90Future)
    .reduce((sum: number, b: any) => sum + Number(b.grand_total || 0), 0)

  const initialForecasts = {
    revenue7d: calculateDeterministicForecast({
      forecastType: 'revenue_7d',
      periodStart: todayStr,
      periodEnd: d7Future,
      historicalCompletedRevenue,
      knownFutureBookingRevenue: future7dRev,
      completedRentalsCount,
      totalBookingsCount,
      historicalDays: 30,
    }),
    revenue30d: calculateDeterministicForecast({
      forecastType: 'revenue_30d',
      periodStart: todayStr,
      periodEnd: d30Future,
      historicalCompletedRevenue,
      knownFutureBookingRevenue: future30dRev,
      completedRentalsCount,
      totalBookingsCount,
      historicalDays: 30,
    }),
    revenue90d: calculateDeterministicForecast({
      forecastType: 'revenue_90d',
      periodStart: todayStr,
      periodEnd: d90Future,
      historicalCompletedRevenue,
      knownFutureBookingRevenue: future90dRev,
      completedRentalsCount,
      totalBookingsCount,
      historicalDays: 30,
    }),
  }

  return (
    <div className="px-4 py-6 md:px-8">
      <AIToolsClient
        initialBrief={initialBrief}
        initialContext={sanitized}
        initialForecasts={initialForecasts}
        initialInsights={initialInsights || []}
        initialReportHistory={reportHistory || []}
        providerConfig={providerConfig}
      />
    </div>
  )
}
