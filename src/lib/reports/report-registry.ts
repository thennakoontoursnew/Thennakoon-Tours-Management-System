export interface ReportDefinition {
  id: string
  name: string
  description: string
  category: 'operations' | 'finance' | 'crm' | 'fleet' | 'drivers' | 'maintenance' | 'communication' | 'executive'
  supportedCharts?: string[]
  supportsCsv: boolean
  supportsPdf: boolean
}

export const REPORT_REGISTRY: ReportDefinition[] = [
  // Operations
  { id: 'booking_summary', name: 'Booking Summary Report', description: 'Comprehensive view of all booking reservations, rental dates, and collection status.', category: 'operations', supportsCsv: true, supportsPdf: true },
  { id: 'quotation_summary', name: 'Quotation Conversion Report', description: 'Quotation volume, accepted rates, and booking conversion tracking.', category: 'operations', supportsCsv: true, supportsPdf: true },
  { id: 'agreement_summary', name: 'Rental Agreement Report', description: 'Signed rental agreements, vehicle handover logs, and contract status.', category: 'operations', supportsCsv: true, supportsPdf: true },

  // Finance
  { id: 'revenue_report', name: 'Revenue & Collection Report', description: 'Authoritative collected revenue, invoiced grand totals, and net cash flow.', category: 'finance', supportsCsv: true, supportsPdf: true },
  { id: 'accounts_receivable', name: 'Accounts Receivable Report', description: 'Outstanding balances, due dates, and overdue customer debtors ledger.', category: 'finance', supportsCsv: true, supportsPdf: true },
  { id: 'expense_report', name: 'Operating Expense Report', description: 'Categorized operating expenses, vehicle fuel costs, and maintenance charges.', category: 'finance', supportsCsv: true, supportsPdf: true },
  { id: 'owner-settlements', name: 'Owner Settlement Report', description: 'Third-party vehicle owner payout calculations, revenue shares, and payment history.', category: 'finance', supportsCsv: true, supportsPdf: true },
  { id: 'owner-outstanding', name: 'Owner Outstanding Balances Report', description: 'Unsettled balances, pending payouts, and owner account aging.', category: 'finance', supportsCsv: true, supportsPdf: true },

  // CRM
  { id: 'customer_clv', name: 'Customer Lifetime Value Report', description: 'Customer rental history, completed payment totals, and risk flags.', category: 'crm', supportsCsv: true, supportsPdf: true },
  { id: 'lead_pipeline', name: 'Lead Pipeline & Conversion', description: 'CRM enquiry pipeline, lead sources, and conversion rates.', category: 'crm', supportsCsv: true, supportsPdf: true },

  // Fleet & Owners
  { id: 'fleet_status', name: 'Fleet Utilization Report', description: 'Vehicle availability, active trip utilization, and document health.', category: 'fleet', supportsCsv: true, supportsPdf: true },
  { id: 'vehicle-owners', name: 'Vehicle Owners Roster', description: 'Third-party vehicle owner profiles, partner agreements, and contact details.', category: 'fleet', supportsCsv: true, supportsPdf: true },
  { id: 'fuel-consumption', name: 'Fleet Fuel Consumption Report', description: 'Fuel log history, total liters refueled, and station breakdown.', category: 'fleet', supportsCsv: true, supportsPdf: true },
  { id: 'fuel-cost', name: 'Fuel Cost Breakdown Report', description: 'Vehicle-wise fuel expenditures, cost per liter trends, and trip allocation.', category: 'fleet', supportsCsv: true, supportsPdf: true },
  { id: 'fuel-efficiency', name: 'Vehicle Fuel Efficiency Report', description: 'Km per liter (KM/L) and Liters per 100km (L/100KM) performance metrics.', category: 'fleet', supportsCsv: true, supportsPdf: true },
  { id: 'vehicle-profitability', name: 'Vehicle Profitability Report', description: 'Net contribution per vehicle (Revenue minus Fuel, Maintenance, and Owner Payouts).', category: 'fleet', supportsCsv: true, supportsPdf: true },
  { id: 'fleet-utilization', name: 'Fleet Utilization Analytics', description: 'Vehicle active trip days, mileage logs, and utilization percentage.', category: 'fleet', supportsCsv: true, supportsPdf: true },
  { id: 'fleet-downtime', name: 'Fleet Downtime & Maintenance Analysis', description: 'Downtime history, service hours lost, and vehicle reliability metrics.', category: 'fleet', supportsCsv: true, supportsPdf: true },
  { id: 'ownership-comparison', name: 'Company-Owned vs External-Owner Comparison', description: 'Comparative financial performance and margin analysis by ownership type.', category: 'fleet', supportsCsv: true, supportsPdf: true },

  // Drivers
  { id: 'driver_performance', name: 'Driver Operations & Compliance', description: 'Driver assignment history, compliance document health, and incident logs.', category: 'drivers', supportsCsv: true, supportsPdf: true },

  // Maintenance
  { id: 'maintenance_due', name: 'Maintenance & Service Report', description: 'Scheduled vehicle servicing, repair costs, and inspection results.', category: 'maintenance', supportsCsv: true, supportsPdf: true },

  // Communication
  { id: 'communication_activity', name: 'Communication Activity Report', description: 'Reminder dispatch history, WhatsApp chat logs, and follow-up activities.', category: 'communication', supportsCsv: true, supportsPdf: true },

  // Executive
  { id: 'executive_summary', name: 'Monthly Executive Overview', description: 'High-level business performance summary across revenue, fleet, and sales.', category: 'executive', supportsCsv: true, supportsPdf: true },
]
