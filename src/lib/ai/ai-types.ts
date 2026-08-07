export type AIProviderName = 'openai' | 'anthropic' | 'gemini' | 'custom' | 'deterministic'

export interface AIProviderConfig {
  provider: AIProviderName
  apiKey?: string
  model?: string
  isConfigured: boolean
}

export type InsightPriority = 'critical' | 'high' | 'opportunity' | 'informational'

export type InsightCategory = 'finance' | 'bookings' | 'fleet' | 'crm' | 'marketing' | 'maintenance' | 'operations'

export interface AIInsightEvidence {
  metric: string
  value: number | string
  comparison_value?: number | string
  change_pct?: number
  unit?: string
}

export interface AIInsightItem {
  id?: string
  insight_number?: string
  category: InsightCategory
  priority: InsightPriority
  title: string
  summary: string
  evidence: AIInsightEvidence[]
  recommendation: string
  related_entity_type?: string
  related_entity_id?: string
  period_start?: string
  period_end?: string
  status?: 'new' | 'reviewed' | 'dismissed'
}

export type ForecastType = 'revenue_7d' | 'revenue_30d' | 'revenue_90d' | 'booking_demand' | 'fleet_demand'
export type ConfidenceLevel = 'low' | 'medium' | 'high'
export type DataQualityRating = 'excellent' | 'good' | 'limited' | 'insufficient'

export interface AIForecastResult {
  id?: string
  forecast_number?: string
  forecast_type: ForecastType
  period_start: string
  period_end: string
  forecast_value: number
  lower_bound: number
  upper_bound: number
  confidence_level: ConfidenceLevel
  data_quality: DataQualityRating
  methodology: string
  data_snapshot: Record<string, any>
  actual_value?: number | null
  accuracy_percentage?: number | null
  explanation?: string
}

export interface PeriodMetricComparison {
  metricKey: string
  metricLabel: string
  currentValue: number
  previousValue: number
  difference: number
  changePct: number
  unit?: string
}

export interface AIExecutiveBriefData {
  businessPerformanceSummary: string
  revenuePerformanceSummary: string
  bookingPerformanceSummary: string
  fleetPerformanceSummary: string
  crmPerformanceSummary: string
  marketingPerformanceSummary: string
  maintenanceRiskSummary: string
  outstandingFinancialIssues: string[]
  operationalAlerts: string[]
  recommendedActions: AIInsightItem[]
  comparisons: PeriodMetricComparison[]
}

export interface SanitizedAIContext {
  period: {
    periodKey: string
    startDate: string
    endDate: string
    previousStartDate: string
    previousEndDate: string
  }
  dataQuality: DataQualityRating
  finance: {
    collectedRevenue: number
    invoicedRevenue: number
    outstandingBalance: number
    overdueBalance: number
    expenses: number
    netCashFlow: number
    avgBookingValue: number
    revenuePerVehicle: number
  }
  bookings: {
    totalBookings: number
    confirmedBookings: number
    completedRentals: number
    cancelledBookings: number
    noShows: number
    avgRentalDays: number
    cancellationRatePct: number
  }
  fleet: {
    totalFleet: number
    available: number
    onTrip: number
    maintenance: number
    inspectionRequired: number
    utilizationRatePct: number
    companyOwnedCount: number
    externalOwnerCount: number
    totalFuelCost: number
    totalMaintenanceCost: number
    totalOwnerPayouts: number
    avgKmPerLiter: number
  }
  customers: {
    totalCustomers: number
    newCustomers: number
    repeatCustomers: number
    leadCount: number
    convertedLeads: number
    conversionRatePct: number
  }
  maintenance: {
    scheduledCount: number
    overdueCount: number
    inspectionFailures: number
    documentExpiringCount: number
  }
  marketing: {
    campaignSpend: number
    attributedRevenue: number
    roas: number
    leadsGenerated: number
  }
  reminders: {
    dueTodayCount: number
    overdueCount: number
    criticalCount: number
  }
}

export type AllowedQueryIntent =
  | 'finance_summary'
  | 'booking_summary'
  | 'fleet_performance'
  | 'vehicle_profitability'
  | 'customer_summary'
  | 'lead_summary'
  | 'marketing_summary'
  | 'maintenance_summary'
  | 'driver_summary'
  | 'outstanding_invoices'
  | 'upcoming_bookings'
  | 'executive_summary'

export interface AskManagementAIResult {
  question: string
  intent: AllowedQueryIntent | 'unsupported'
  isSupported: boolean
  answer: string
  evidence: AIInsightEvidence[]
  relatedModule?: string
  confidence: ConfidenceLevel
}
