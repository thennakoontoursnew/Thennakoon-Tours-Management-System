import { AIExecutiveBriefData, AIInsightItem } from './ai-types'

export function validateAndParseJSON<T>(rawText: string, fallback: T): T {
  if (!rawText || typeof rawText !== 'string') return fallback

  let cleaned = rawText.trim()
  // Remove markdown code fences if present
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
  }

  try {
    const parsed = JSON.parse(cleaned)
    return parsed as T
  } catch (_) {
    return fallback
  }
}

export function validateExecutiveBrief(parsed: any, fallback: AIExecutiveBriefData): AIExecutiveBriefData {
  if (!parsed || typeof parsed !== 'object') return fallback

  return {
    businessPerformanceSummary: String(parsed.businessPerformanceSummary || fallback.businessPerformanceSummary),
    revenuePerformanceSummary: String(parsed.revenuePerformanceSummary || fallback.revenuePerformanceSummary),
    bookingPerformanceSummary: String(parsed.bookingPerformanceSummary || fallback.bookingPerformanceSummary),
    fleetPerformanceSummary: String(parsed.fleetPerformanceSummary || fallback.fleetPerformanceSummary),
    crmPerformanceSummary: String(parsed.crmPerformanceSummary || fallback.crmPerformanceSummary),
    marketingPerformanceSummary: String(parsed.marketingPerformanceSummary || fallback.marketingPerformanceSummary),
    maintenanceRiskSummary: String(parsed.maintenanceRiskSummary || fallback.maintenanceRiskSummary),
    outstandingFinancialIssues: Array.isArray(parsed.outstandingFinancialIssues)
      ? parsed.outstandingFinancialIssues.map(String)
      : fallback.outstandingFinancialIssues,
    operationalAlerts: Array.isArray(parsed.operationalAlerts)
      ? parsed.operationalAlerts.map(String)
      : fallback.operationalAlerts,
    recommendedActions: Array.isArray(parsed.recommendedActions)
      ? parsed.recommendedActions.map(validateInsightItem).filter(Boolean) as AIInsightItem[]
      : fallback.recommendedActions,
    comparisons: fallback.comparisons,
  }
}

export function validateInsightItem(item: any): AIInsightItem | null {
  if (!item || typeof item !== 'object') return null
  if (!item.title || !item.summary) return null

  return {
    category: ['finance', 'bookings', 'fleet', 'crm', 'marketing', 'maintenance', 'operations'].includes(item.category)
      ? item.category
      : 'operations',
    priority: ['critical', 'high', 'opportunity', 'informational'].includes(item.priority)
      ? item.priority
      : 'informational',
    title: String(item.title),
    summary: String(item.summary),
    evidence: Array.isArray(item.evidence) ? item.evidence : [],
    recommendation: String(item.recommendation || item.summary),
  }
}
