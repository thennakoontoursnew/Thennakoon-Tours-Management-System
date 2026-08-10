import { getFinanceSummaryKPIs } from '@/lib/finance/finance-service'
import { getInspectionCenterSummary, getMaintenanceCenterSummary } from '@/lib/maintenance/maintenance-service'
import { getReminderCenterSummary } from '@/lib/reminders/reminder-service'
import { getDriverSummaryKPIs } from '@/lib/drivers/driver-service'
import { REPORT_REGISTRY, ReportDefinition } from './report-registry'

export async function getConsolidatedReportData(supabase: any, reportId: string, period: string = 'this_month') {
  const definition = REPORT_REGISTRY.find((r) => r.id === reportId) || REPORT_REGISTRY[0]

  const [financeKPIs, maintenanceKPIs, inspectionKPIs, reminderKPIs, driverKPIs] = await Promise.all([
    getFinanceSummaryKPIs(supabase, period),
    getMaintenanceCenterSummary(supabase),
    getInspectionCenterSummary(supabase),
    getReminderCenterSummary(supabase),
    getDriverSummaryKPIs(supabase),
  ])

  // Fetch report-specific tabular data
  let rows: any[] = []

  if (reportId === 'booking_summary' || reportId === 'executive_summary') {
    const { data } = await supabase
      .from('bookings')
      .select('id, booking_number, rental_start_at, rental_end_at, status, customer:customers(full_name)')
      .order('created_at', { ascending: false })
      .limit(50)
    rows = data || []
  } else if (reportId === 'user_agreements_report' || reportId === 'agreement_summary') {
    const { data } = await supabase
      .from('rental_agreements')
      .select('id, agreement_number, rental_start_at, rental_end_at, status, created_at, customer:customers(full_name), booking:bookings(booking_number)')
      .order('created_at', { ascending: false })
    rows = data || []
  } else if (reportId === 'owner_agreements_report' || reportId === 'owner_agreements_expiry_report') {
    const { data } = await supabase
      .from('owner_agreements')
      .select('id, agreement_number, agreement_start_date, agreement_end_date, settlement_rule, revenue_share_pct, flat_rate_per_day, status, owner:vehicle_owners(full_name, owner_number)')
      .eq('is_archived', false)
      .order('created_at', { ascending: false })
    rows = data || []
  } else if (reportId === 'revenue_report' || reportId === 'accounts_receivable') {
    const { data } = await supabase
      .from('invoices')
      .select('id, invoice_number, grand_total, amount_paid, balance_due, due_date, status, customer:customers(full_name)')
      .order('created_at', { ascending: false })
      .limit(50)
    rows = data || []
  } else if (reportId === 'expense_report') {
    const { data } = await supabase
      .from('expenses')
      .select('id, expense_number, expense_date, category, description, amount, payment_method, status')
      .order('expense_date', { ascending: false })
      .limit(50)
    rows = data || []
  } else if (reportId === 'maintenance_due') {
    const { data } = await supabase
      .from('maintenance_tasks')
      .select('id, task_number, title, task_type, priority, scheduled_date, status, vehicle:vehicles(vehicle_name, registration_number)')
      .order('scheduled_date', { ascending: false })
      .limit(50)
    rows = data || []
  } else if (reportId === 'lead_pipeline') {
    const { data } = await supabase
      .from('crm_leads')
      .select('id, lead_number, customer_name, source, status, estimated_value, created_at')
      .order('created_at', { ascending: false })
      .limit(50)
    rows = data || []
  } else if (reportId === 'vehicle-owners') {
    const { data } = await supabase
      .from('vehicle_owners')
      .select('id, owner_number, full_name, company_name, owner_type, mobile, email, settlement_rule, revenue_share_pct, flat_rate_per_day, is_active')
      .order('full_name', { ascending: true })
    rows = data || []
  } else if (reportId === 'owner-settlements' || reportId === 'owner-outstanding') {
    const { data } = await supabase
      .from('owner_payouts')
      .select('id, payout_number, period_start, period_end, gross_revenue, owner_share_amount, deductions, net_payout, amount_paid, outstanding_balance, status, owner:vehicle_owners(full_name, owner_number)')
      .order('period_start', { ascending: false })
    rows = data || []
  } else if (reportId === 'fuel-consumption' || reportId === 'fuel-cost' || reportId === 'fuel-efficiency') {
    const { data } = await supabase
      .from('fuel_logs')
      .select('id, log_date, liters, cost_per_liter, total_cost, odometer_reading, km_since_last_refuel, km_per_liter, liters_per_100km, station_name, vehicle:vehicles(vehicle_name, registration_number)')
      .order('log_date', { ascending: false })
    rows = data || []
  } else if (reportId === 'vehicle-profitability' || reportId === 'fleet-utilization' || reportId === 'ownership-comparison' || reportId === 'fleet-downtime') {
    const { data } = await supabase
      .from('vehicles')
      .select('id, vehicle_name, registration_number, ownership_type, status, current_mileage, service_due_mileage, owner:vehicle_owners(full_name)')
      .eq('is_archived', false)
    rows = data || []
  } else if (reportId === 'ai_executive_report' || reportId === 'ai_financial_analysis' || reportId === 'ai_fleet_analysis') {
    const { data } = await supabase
      .from('ai_generated_reports')
      .select('*')
      .order('generated_at', { ascending: false })
      .limit(30)
    rows = data || []
  } else if (reportId === 'revenue_forecast_report') {
    const { data } = await supabase
      .from('ai_forecasts')
      .select('*')
      .order('generated_at', { ascending: false })
      .limit(30)
    rows = data || []
  }

  return {
    definition,
    period,
    kpis: {
      finance: financeKPIs,
      maintenance: maintenanceKPIs,
      inspection: inspectionKPIs,
      reminder: reminderKPIs,
      driver: driverKPIs,
    },
    rows,
  }
}

export function generateCsvString(headers: string[], rows: any[][]): string {
  const escapeCsv = (val: any) => {
    if (val === null || val === undefined) return '""'
    const str = String(val).replace(/"/g, '""')
    return `"${str}"`
  }

  const headerLine = headers.map(escapeCsv).join(',')
  const bodyLines = rows.map((r) => r.map(escapeCsv).join(','))
  return [headerLine, ...bodyLines].join('\n')
}
