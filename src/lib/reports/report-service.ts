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
