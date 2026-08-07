'use server'

import { createClient } from '@/lib/supabase/server'
import { generateAIExecutiveBrief, generateAIForecasts } from '@/lib/ai/ai-service'
import {
  classifyManagementQueryIntent,
  executeAllowlistedQuery,
  getSanitizedContextForPeriod,
} from '@/lib/ai/management-intelligence-service'
import { getAIProviderConfig } from '@/lib/ai/ai-provider'
import { revalidatePath } from 'next/cache'

// =============================================
// GENERATE EXECUTIVE BRIEF ACTION
// =============================================
export async function generateAIExecutiveBriefAction(periodKey: string = 'this_month') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    const result = await generateAIExecutiveBrief(supabase, periodKey, user.id)
    revalidatePath('/dashboard/ai-tools')
    return { success: true, ...result }
  } catch (err: any) {
    return { error: err.message || 'Failed to generate brief' }
  }
}

// =============================================
// GENERATE FORECASTS ACTION
// =============================================
export async function generateAIForecastsAction() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    const forecasts = await generateAIForecasts(supabase, user.id)
    revalidatePath('/dashboard/ai-tools')
    return { success: true, forecasts }
  } catch (err: any) {
    return { error: err.message || 'Failed to generate forecasts' }
  }
}

// =============================================
// ASK MANAGEMENT AI ACTION (ALLOWLISTED QUERY INTENTS ONLY)
// =============================================
export async function askManagementAIAction(question: string, periodKey: string = 'this_month') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  if (!question || !question.trim()) {
    return { error: 'Question is required' }
  }

  try {
    const { sanitized } = await getSanitizedContextForPeriod(supabase, periodKey)
    const { intent, isSupported } = classifyManagementQueryIntent(question)
    const queryResult = executeAllowlistedQuery(sanitized, intent, question)
    const providerConfig = getAIProviderConfig()

    // Log query in ai_query_logs table
    await supabase.from('ai_query_logs').insert({
      user_id: user.id,
      question: question.trim(),
      intent: intent,
      response_summary: queryResult.answer,
      context_metadata: { evidence: queryResult.evidence, confidence: queryResult.confidence },
      provider: providerConfig.provider,
      model: providerConfig.model || 'none',
    })

    return {
      success: true,
      result: queryResult,
      providerConfig,
    }
  } catch (err: any) {
    return { error: err.message || 'Failed to execute management query' }
  }
}

// =============================================
// UPDATE INSIGHT STATUS ACTION
// =============================================
export async function updateInsightStatusAction(insightId: string, status: 'reviewed' | 'dismissed') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('ai_insights')
    .update({ status })
    .eq('id', insightId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/ai-tools')
  return { success: true }
}
