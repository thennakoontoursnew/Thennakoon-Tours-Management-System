import { calculateDeterministicForecast } from './ai-forecast-service'
import { generateStructuredInsight, getAIProviderConfig } from './ai-provider'
import { buildExecutiveBriefSystemPrompt } from './ai-prompts'
import { validateAndParseJSON, validateExecutiveBrief } from './ai-response-validator'
import {
  generateDeterministicExecutiveBrief,
  getSanitizedContextForPeriod,
} from './management-intelligence-service'
import { AIForecastResult, AIInsightItem } from './ai-types'

export async function generateAIExecutiveBrief(supabase: any, periodKey: string = 'this_month', userId?: string) {
  const { sanitized, comparisons } = await getSanitizedContextForPeriod(supabase, periodKey)
  const providerConfig = getAIProviderConfig()

  const deterministicBrief = generateDeterministicExecutiveBrief(sanitized, comparisons)

  let finalBrief = deterministicBrief
  let providerUsed = 'deterministic'
  let modelUsed = 'deterministic'

  if (providerConfig.isConfigured) {
    const aiResult = await generateStructuredInsight({
      systemPrompt: buildExecutiveBriefSystemPrompt(),
      context: sanitized,
    })

    if (aiResult.success && aiResult.rawOutput) {
      const parsed = validateAndParseJSON(aiResult.rawOutput, null)
      if (parsed) {
        finalBrief = validateExecutiveBrief(parsed, deterministicBrief)
        providerUsed = aiResult.provider
        modelUsed = aiResult.model
      }
    }
  }

  // Save report snapshot to database
  try {
    const { data: reportNum } = await supabase.rpc('generate_next_ai_report_number')
    const finalReportNum = reportNum || `AIR-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`

    const { data: savedReport } = await supabase
      .from('ai_generated_reports')
      .insert({
        report_number: finalReportNum,
        report_type: 'executive',
        period_start: sanitized.period.startDate,
        period_end: sanitized.period.endDate,
        status: 'completed',
        metric_snapshot: sanitized,
        ai_output: finalBrief,
        provider: providerUsed,
        model: modelUsed,
        generated_by: userId || null,
      })
      .select()
      .single()

    // Save insights if report saved
    if (savedReport?.id && finalBrief.recommendedActions.length > 0) {
      for (const item of finalBrief.recommendedActions) {
        try {
          const { data: insightNum } = await supabase.rpc('generate_next_ai_insight_number')
          const finalInsightNum = insightNum || `AII-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`

          await supabase.from('ai_insights').insert({
            insight_number: finalInsightNum,
            category: item.category,
            priority: item.priority,
            title: item.title,
            summary: item.summary,
            evidence: item.evidence,
            recommendation: item.recommendation,
            period_start: sanitized.period.startDate,
            period_end: sanitized.period.endDate,
            status: 'new',
            generated_report_id: savedReport.id,
          })
        } catch (_) {}
      }
    }
  } catch (_) {}

  return {
    brief: finalBrief,
    sanitizedContext: sanitized,
    providerConfig,
    providerUsed,
  }
}

export async function generateAIForecasts(supabase: any, userId?: string): Promise<{
  revenue7d: AIForecastResult
  revenue30d: AIForecastResult
  revenue90d: AIForecastResult
}> {
  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)
  const d30Ago = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  // Fetch 30-day historical completed payments
  const [paymentsRes, bookingsRes] = await Promise.all([
    supabase.from('payments').select('amount').eq('status', 'completed').gte('payment_date', d30Ago).lte('payment_date', todayStr),
    supabase.from('bookings').select('id, grand_total, rental_start_at, status').eq('is_archived', false),
  ])

  const payments = paymentsRes.data || []
  const bookings = bookingsRes.data || []

  const historicalCompletedRevenue = payments.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0)
  const completedRentalsCount = bookings.filter((b: any) => b.status === 'closed' || b.status === 'completed').length
  const totalBookingsCount = bookings.length

  // Future booking pipeline for next 7, 30, 90 days
  const d7Future = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const d30Future = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const d90Future = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const future7dRev = bookings
    .filter((b: any) => ['confirmed', 'ready', 'in_progress'].includes(b.status) && b.rental_start_at && b.rental_start_at.slice(0, 10) <= d7Future)
    .reduce((sum: number, b: any) => sum + Number(b.grand_total || 0), 0)

  const future30dRev = bookings
    .filter((b: any) => ['confirmed', 'ready', 'in_progress'].includes(b.status) && b.rental_start_at && b.rental_start_at.slice(0, 10) <= d30Future)
    .reduce((sum: number, b: any) => sum + Number(b.grand_total || 0), 0)

  const future90dRev = bookings
    .filter((b: any) => ['confirmed', 'ready', 'in_progress'].includes(b.status) && b.rental_start_at && b.rental_start_at.slice(0, 10) <= d90Future)
    .reduce((sum: number, b: any) => sum + Number(b.grand_total || 0), 0)

  const revenue7d = calculateDeterministicForecast({
    forecastType: 'revenue_7d',
    periodStart: todayStr,
    periodEnd: d7Future,
    historicalCompletedRevenue,
    knownFutureBookingRevenue: future7dRev,
    completedRentalsCount,
    totalBookingsCount,
    historicalDays: 30,
  })

  const revenue30d = calculateDeterministicForecast({
    forecastType: 'revenue_30d',
    periodStart: todayStr,
    periodEnd: d30Future,
    historicalCompletedRevenue,
    knownFutureBookingRevenue: future30dRev,
    completedRentalsCount,
    totalBookingsCount,
    historicalDays: 30,
  })

  const revenue90d = calculateDeterministicForecast({
    forecastType: 'revenue_90d',
    periodStart: todayStr,
    periodEnd: d90Future,
    historicalCompletedRevenue,
    knownFutureBookingRevenue: future90dRev,
    completedRentalsCount,
    totalBookingsCount,
    historicalDays: 30,
  })

  // Persist forecasts to database
  try {
    for (const fc of [revenue7d, revenue30d, revenue90d]) {
      const { data: fcNum } = await supabase.rpc('generate_next_ai_forecast_number')
      const finalFcNum = fcNum || `FCT-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`

      await supabase.from('ai_forecasts').insert({
        forecast_number: finalFcNum,
        forecast_type: fc.forecast_type,
        period_start: fc.period_start,
        period_end: fc.period_end,
        forecast_value: fc.forecast_value,
        lower_bound: fc.lower_bound,
        upper_bound: fc.upper_bound,
        confidence_level: fc.confidence_level,
        data_quality: fc.data_quality,
        methodology: fc.methodology,
        data_snapshot: fc.data_snapshot,
        generated_by: userId || null,
      })
    }
  } catch (_) {}

  return { revenue7d, revenue30d, revenue90d }
}
