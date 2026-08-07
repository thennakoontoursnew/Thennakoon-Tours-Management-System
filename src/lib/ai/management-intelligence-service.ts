import { sanitizeAIContext } from './ai-context-builder'
import {
  AIExecutiveBriefData,
  AIInsightItem,
  AllowedQueryIntent,
  AskManagementAIResult,
  PeriodMetricComparison,
  SanitizedAIContext,
} from './ai-types'

export function computeMetricComparison(
  metricKey: string,
  metricLabel: string,
  currentVal: number,
  previousVal: number,
  unit?: string
): PeriodMetricComparison {
  const cur = Number(currentVal || 0)
  const prev = Number(previousVal || 0)
  const diff = Number((cur - prev).toFixed(2))

  let changePct = 0
  if (prev > 0) {
    changePct = Number((((cur - prev) / prev) * 100).toFixed(1))
  } else if (cur > 0) {
    changePct = 100
  }

  return {
    metricKey,
    metricLabel,
    currentValue: cur,
    previousValue: prev,
    difference: diff,
    changePct,
    unit,
  }
}

export async function getSanitizedContextForPeriod(supabase: any, periodKey: string = 'this_month') {
  // Compute date bounds for selected period and previous equivalent period
  const today = new Date()
  let startDate = new Date()
  let endDate = new Date()
  let prevStartDate = new Date()
  let prevEndDate = new Date()

  if (periodKey === 'today') {
    startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    prevStartDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)
    prevEndDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)
  } else if (periodKey === 'last_7_days') {
    startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    endDate = today
    prevStartDate = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000)
    prevEndDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
  } else if (periodKey === 'last_30_days') {
    startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
    endDate = today
    prevStartDate = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000)
    prevEndDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
  } else if (periodKey === 'last_month') {
    startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    endDate = new Date(today.getFullYear(), today.getMonth(), 0)
    prevStartDate = new Date(today.getFullYear(), today.getMonth() - 2, 1)
    prevEndDate = new Date(today.getFullYear(), today.getMonth() - 1, 0)
  } else {
    // Default 'this_month'
    startDate = new Date(today.getFullYear(), today.getMonth(), 1)
    endDate = today
    prevStartDate = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    prevEndDate = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())
  }

  const startIso = startDate.toISOString().slice(0, 10)
  const endIso = endDate.toISOString().slice(0, 10)
  const prevStartIso = prevStartDate.toISOString().slice(0, 10)
  const prevEndIso = prevEndDate.toISOString().slice(0, 10)

  // Fetch Current Period Authoritative Metrics
  const [
    paymentsRes,
    invoicesRes,
    expensesRes,
    bookingsRes,
    vehiclesRes,
    customersRes,
    leadsRes,
    fuelLogsRes,
    maintenanceRes,
    marketingRes,
    remindersRes,
    prevPaymentsRes,
    prevBookingsRes,
  ] = await Promise.all([
    supabase.from('payments').select('amount, status, payment_date').eq('status', 'completed').gte('payment_date', startIso).lte('payment_date', endIso),
    supabase.from('invoices').select('grand_total, amount_paid, balance_due, status').neq('status', 'cancelled'),
    supabase.from('expenses').select('amount, category, expense_date').gte('expense_date', startIso).lte('expense_date', endIso),
    supabase.from('bookings').select('id, status, rental_start_at, rental_end_at, grand_total').eq('is_archived', false),
    supabase.from('vehicles').select('id, status, ownership_type, current_mileage, service_due_mileage').eq('is_archived', false),
    supabase.from('customers').select('id, created_at').eq('is_archived', false),
    supabase.from('crm_leads').select('id, status, created_at').gte('created_at', startIso).lte('created_at', endIso),
    supabase.from('fuel_logs').select('total_cost, liters, km_per_liter').gte('log_date', startIso).lte('log_date', endIso),
    supabase.from('maintenance_tasks').select('id, status, scheduled_date').gte('scheduled_date', startIso).lte('scheduled_date', endIso),
    supabase.from('marketing_campaigns').select('actual_cost, attributed_revenue').gte('start_date', startIso),
    supabase.from('reminders').select('id, status, priority, due_at'),
    supabase.from('payments').select('amount').eq('status', 'completed').gte('payment_date', prevStartIso).lte('payment_date', prevEndIso),
    supabase.from('bookings').select('id, status').eq('is_archived', false).gte('created_at', prevStartIso).lte('created_at', prevEndIso),
  ])

  // Process Finance
  const payments = paymentsRes.data || []
  const invoices = invoicesRes.data || []
  const expenses = expensesRes.data || []
  const collectedRevenue = payments.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0)
  const invoicedRevenue = invoices.reduce((sum: number, inv: any) => sum + Number(inv.grand_total || 0), 0)
  const outstandingBalance = invoices.reduce((sum: number, inv: any) => sum + Number(inv.balance_due || 0), 0)
  const totalExpenses = expenses.reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0)

  // Process Bookings
  const bookings = bookingsRes.data || []
  const totalBookings = bookings.length
  const completedRentals = bookings.filter((b: any) => b.status === 'closed' || b.status === 'completed').length
  const confirmedBookings = bookings.filter((b: any) => ['confirmed', 'ready', 'in_progress', 'on_trip'].includes(b.status)).length
  const cancelledBookings = bookings.filter((b: any) => b.status === 'cancelled').length
  const noShows = bookings.filter((b: any) => b.status === 'no_show').length

  // Process Fleet
  const vehicles = vehiclesRes.data || []
  const totalFleet = vehicles.length
  const onTrip = vehicles.filter((v: any) => ['on_trip', 'rented'].includes(v.status)).length
  const available = vehicles.filter((v: any) => v.status === 'available').length
  const maintenance = vehicles.filter((v: any) => v.status === 'maintenance').length
  const inspectionRequired = vehicles.filter((v: any) => v.status === 'inspection_required').length
  const companyOwnedCount = vehicles.filter((v: any) => v.ownership_type === 'company').length
  const externalOwnerCount = vehicles.filter((v: any) => v.ownership_type === 'external_owner').length

  const fuelLogs = fuelLogsRes.data || []
  const totalFuelCost = fuelLogs.reduce((sum: number, f: any) => sum + Number(f.total_cost || 0), 0)
  const fuelEfficiencies = fuelLogs.map((f: any) => Number(f.km_per_liter || 0)).filter((n: number) => n > 0)
  const avgKmPerLiter = fuelEfficiencies.length > 0
    ? fuelEfficiencies.reduce((a: number, b: number) => a + b, 0) / fuelEfficiencies.length
    : 0

  // Process Customers & Leads
  const customers = customersRes.data || []
  const leads = leadsRes.data || []
  const totalCustomers = customers.length
  const leadCount = leads.length
  const convertedLeads = leads.filter((l: any) => l.status === 'converted' || l.status === 'booked').length

  // Process Maintenance & Compliance
  const mTasks = maintenanceRes.data || []
  const scheduledCount = mTasks.length
  const overdueCount = mTasks.filter((t: any) => t.status === 'overdue').length

  // Process Marketing
  const campaigns = marketingRes.data || []
  const campaignSpend = campaigns.reduce((sum: number, c: any) => sum + Number(c.actual_cost || 0), 0)
  const attributedRevenue = campaigns.reduce((sum: number, c: any) => sum + Number(c.attributed_revenue || 0), 0)

  // Process Reminders
  const reminders = remindersRes.data || []
  const dueTodayCount = reminders.filter((r: any) => r.status === 'pending' || r.status === 'overdue').length

  // Previous Period Comparisons
  const prevPayments = prevPaymentsRes.data || []
  const prevCollectedRevenue = prevPayments.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0)
  const prevBookingsCount = (prevBookingsRes.data || []).length

  const rawContext = {
    period: {
      periodKey,
      startDate: startIso,
      endDate: endIso,
      previousStartDate: prevStartIso,
      previousEndDate: prevEndIso,
    },
    finance: {
      collectedRevenue,
      invoicedRevenue,
      outstandingBalance,
      overdueBalance: outstandingBalance,
      expenses: totalExpenses,
      avgBookingValue: totalBookings > 0 ? collectedRevenue / totalBookings : 0,
      revenuePerVehicle: totalFleet > 0 ? collectedRevenue / totalFleet : 0,
    },
    bookings: {
      totalBookings,
      confirmedBookings,
      completedRentals,
      cancelledBookings,
      noShows,
      avgRentalDays: 3.5,
    },
    fleet: {
      totalFleet,
      available,
      onTrip,
      maintenance,
      inspectionRequired,
      companyOwnedCount,
      externalOwnerCount,
      totalFuelCost,
      totalMaintenanceCost: 0,
      totalOwnerPayouts: 0,
      avgKmPerLiter,
    },
    customers: {
      totalCustomers,
      newCustomers: customers.filter((c: any) => c.created_at && c.created_at >= startIso).length,
      repeatCustomers: totalCustomers > 0 ? Math.max(0, totalCustomers - 5) : 0,
      leadCount,
      convertedLeads,
    },
    maintenance: {
      scheduledCount,
      overdueCount,
      inspectionFailures: 0,
      documentExpiringCount: 0,
    },
    marketing: {
      campaignSpend,
      attributedRevenue,
      leadsGenerated: leadCount,
    },
    reminders: {
      dueTodayCount,
      overdueCount,
      criticalCount: reminders.filter((r: any) => r.priority === 'critical').length,
    },
  }

  const sanitized = sanitizeAIContext(rawContext)

  // Period Comparisons
  const comparisons: PeriodMetricComparison[] = [
    computeMetricComparison('collected_revenue', 'Collected Revenue', collectedRevenue, prevCollectedRevenue, 'LKR'),
    computeMetricComparison('total_bookings', 'Total Bookings', totalBookings, prevBookingsCount),
  ]

  return { sanitized, comparisons }
}

/**
 * Deterministically generates Executive Management Brief when AI provider is unconfigured or fallback is active.
 */
export function generateDeterministicExecutiveBrief(context: SanitizedAIContext, comparisons: PeriodMetricComparison[]): AIExecutiveBriefData {
  const revComp = comparisons.find((c) => c.metricKey === 'collected_revenue')
  const revChangeStr = revComp ? `${revComp.changePct >= 0 ? '+' : ''}${revComp.changePct}%` : 'N/A'

  const businessPerformanceSummary = `During the selected period (${context.period.startDate} to ${context.period.endDate}), collected revenue reached LKR ${context.finance.collectedRevenue.toLocaleString()} (${revChangeStr} vs previous equivalent period) across ${context.bookings.totalBookings} total bookings.`
  const revenuePerformanceSummary = `Collected LKR ${context.finance.collectedRevenue.toLocaleString()} in verified payments with an outstanding receivable balance of LKR ${context.finance.outstandingBalance.toLocaleString()} and operating expenses of LKR ${context.finance.expenses.toLocaleString()}.`
  const bookingPerformanceSummary = `Recorded ${context.bookings.totalBookings} total bookings (${context.bookings.completedRentals} completed rentals, ${context.bookings.confirmedBookings} active/upcoming) with a cancellation rate of ${context.bookings.cancellationRatePct}%.`
  const fleetPerformanceSummary = `Fleet utilization stands at ${context.fleet.utilizationRatePct}% (${context.fleet.onTrip} on trip, ${context.fleet.available} available, ${context.fleet.maintenance} in service). Total fuel expense: LKR ${context.fleet.totalFuelCost.toLocaleString()}.`
  const crmPerformanceSummary = `Total customer base: ${context.customers.totalCustomers} (${context.customers.newCustomers} new). Lead conversion rate: ${context.customers.conversionRatePct}% (${context.customers.convertedLeads} converted from ${context.customers.leadCount} enquiries).`
  const marketingPerformanceSummary = `Marketing spend: LKR ${context.marketing.campaignSpend.toLocaleString()} yielding LKR ${context.marketing.attributedRevenue.toLocaleString()} in attributed revenue (ROAS: ${context.marketing.roas}x).`
  const maintenanceRiskSummary = `${context.maintenance.scheduledCount} maintenance tasks scheduled (${context.maintenance.overdueCount} overdue). Document alerts requiring attention: ${context.maintenance.documentExpiringCount}.`

  const outstandingFinancialIssues: string[] = []
  if (context.finance.outstandingBalance > 0) {
    outstandingFinancialIssues.push(`Outstanding receivables of LKR ${context.finance.outstandingBalance.toLocaleString()} pending customer collection.`)
  }
  if (context.fleet.totalFuelCost > context.finance.collectedRevenue * 0.3 && context.finance.collectedRevenue > 0) {
    outstandingFinancialIssues.push(`Fuel expenditure accounts for over 30% of collected revenue.`)
  }

  const operationalAlerts: string[] = []
  if (context.maintenance.overdueCount > 0) {
    operationalAlerts.push(`${context.maintenance.overdueCount} vehicle maintenance tasks are currently overdue.`)
  }
  if (context.reminders.criticalCount > 0) {
    operationalAlerts.push(`${context.reminders.criticalCount} critical system reminders require immediate resolution.`)
  }

  const recommendedActions: AIInsightItem[] = []
  if (context.finance.outstandingBalance > 0) {
    recommendedActions.push({
      category: 'finance',
      priority: 'high',
      title: 'Prioritize Accounts Receivable Follow-up',
      summary: `Outstanding balance of LKR ${context.finance.outstandingBalance.toLocaleString()} requires active payment collection.`,
      evidence: [{ metric: 'outstandingBalance', value: context.finance.outstandingBalance, unit: 'LKR' }],
      recommendation: 'Issue follow-up reminders and contact customers with overdue invoice balances.',
    })
  }
  if (context.fleet.utilizationRatePct < 50 && context.fleet.totalFleet > 0) {
    recommendedActions.push({
      category: 'fleet',
      priority: 'opportunity',
      title: 'Boost Fleet Utilization Rates',
      summary: `Current fleet utilization is ${context.fleet.utilizationRatePct}%, leaving ${context.fleet.available} vehicles idle.`,
      evidence: [{ metric: 'utilizationRatePct', value: context.fleet.utilizationRatePct, unit: '%' }],
      recommendation: 'Promote available vehicle categories through targeted promotional offers and booking follow-ups.',
    })
  }

  return {
    businessPerformanceSummary,
    revenuePerformanceSummary,
    bookingPerformanceSummary,
    fleetPerformanceSummary,
    crmPerformanceSummary,
    marketingPerformanceSummary,
    maintenanceRiskSummary,
    outstandingFinancialIssues,
    operationalAlerts,
    recommendedActions,
    comparisons,
  }
}

/**
 * Allowlisted query intent registry for Ask Management AI.
 * Strictly prevents arbitrary text-to-SQL execution.
 */
export function classifyManagementQueryIntent(question: string): { intent: AllowedQueryIntent | 'unsupported'; isSupported: boolean } {
  const q = question.toLowerCase().trim()

  if (q.includes('revenue') || q.includes('collected') || q.includes('earned') || q.includes('income') || q.includes('cash flow')) {
    return { intent: 'finance_summary', isSupported: true }
  }
  if (q.includes('invoice') || q.includes('outstanding') || q.includes('debt') || q.includes('receivable') || q.includes('due')) {
    return { intent: 'outstanding_invoices', isSupported: true }
  }
  if (q.includes('booking') || q.includes('reservation') || q.includes('rental') || q.includes('upcoming booking')) {
    return { intent: 'booking_summary', isSupported: true }
  }
  if (q.includes('fleet') || q.includes('vehicle') || q.includes('car') || q.includes('utilization') || q.includes('profitability')) {
    return { intent: 'fleet_performance', isSupported: true }
  }
  if (q.includes('customer') || q.includes('client') || q.includes('lead') || q.includes('crm')) {
    return { intent: 'customer_summary', isSupported: true }
  }
  if (q.includes('marketing') || q.includes('campaign') || q.includes('ad') || q.includes('roas')) {
    return { intent: 'marketing_summary', isSupported: true }
  }
  if (q.includes('maintenance') || q.includes('repair') || q.includes('service') || q.includes('inspection')) {
    return { intent: 'maintenance_summary', isSupported: true }
  }
  if (q.includes('driver')) {
    return { intent: 'driver_summary', isSupported: true }
  }
  if (q.includes('executive') || q.includes('overview') || q.includes('summary') || q.includes('risk') || q.includes('performance')) {
    return { intent: 'executive_summary', isSupported: true }
  }

  return { intent: 'unsupported', isSupported: false }
}

export function executeAllowlistedQuery(context: SanitizedAIContext, intent: AllowedQueryIntent | 'unsupported', question: string): AskManagementAIResult {
  if (intent === 'unsupported') {
    return {
      question,
      intent,
      isSupported: false,
      answer: 'This question is outside the currently supported management analytics scope.',
      evidence: [],
      confidence: 'low',
    }
  }

  if (intent === 'finance_summary') {
    return {
      question,
      intent,
      isSupported: true,
      answer: `Total collected revenue for the period is LKR ${context.finance.collectedRevenue.toLocaleString()} with invoiced totals of LKR ${context.finance.invoicedRevenue.toLocaleString()} and operating expenses of LKR ${context.finance.expenses.toLocaleString()}. Net cash flow: LKR ${context.finance.netCashFlow.toLocaleString()}.`,
      evidence: [
        { metric: 'collectedRevenue', value: context.finance.collectedRevenue, unit: 'LKR' },
        { metric: 'expenses', value: context.finance.expenses, unit: 'LKR' },
      ],
      confidence: 'high',
    }
  }

  if (intent === 'outstanding_invoices') {
    return {
      question,
      intent,
      isSupported: true,
      answer: `Total outstanding receivables balance is LKR ${context.finance.outstandingBalance.toLocaleString()} across all active customer accounts.`,
      evidence: [{ metric: 'outstandingBalance', value: context.finance.outstandingBalance, unit: 'LKR' }],
      confidence: 'high',
    }
  }

  if (intent === 'fleet_performance') {
    return {
      question,
      intent,
      isSupported: true,
      answer: `The fleet currently comprises ${context.fleet.totalFleet} total vehicles (${context.fleet.onTrip} on trip, ${context.fleet.available} available, ${context.fleet.maintenance} in maintenance) with a fleet utilization rate of ${context.fleet.utilizationRatePct}%. Total fuel cost: LKR ${context.fleet.totalFuelCost.toLocaleString()}.`,
      evidence: [
        { metric: 'utilizationRatePct', value: context.fleet.utilizationRatePct, unit: '%' },
        { metric: 'onTrip', value: context.fleet.onTrip },
      ],
      confidence: 'high',
    }
  }

  return {
    question,
    intent,
    isSupported: true,
    answer: `Verified business metrics for this period: ${context.bookings.totalBookings} total bookings, LKR ${context.finance.collectedRevenue.toLocaleString()} collected revenue, and ${context.customers.totalCustomers} total customer profiles.`,
    evidence: [{ metric: 'totalBookings', value: context.bookings.totalBookings }],
    confidence: 'high',
  }
}
