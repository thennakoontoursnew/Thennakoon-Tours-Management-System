import { getColomboTodayString } from '@/lib/utils/colombo-date-utils'

export interface CustomerKPIs {
  totalCustomers: number
  activeCustomers: number
  repeatCustomers: number
  newThisMonth: number
  outstandingCustomersCount: number
  riskWatchCount: number
}

export interface LeadKPIs {
  totalLeads: number
  newLeads: number
  contactedLeads: number
  qualifiedLeads: number
  quotationsSent: number
  wonLeads: number
  lostLeads: number
  conversionRate: number
}

// Normalize Sri Lankan phone numbers to canonical local format 07XXXXXXXX or +947XXXXXXXX for WhatsApp links
export function normalizePhone(phoneStr?: string | null): { local: string; e164: string } {
  if (!phoneStr) return { local: '', e164: '' }
  const digits = phoneStr.replace(/\D/g, '')

  if (digits.startsWith('94') && digits.length === 11) {
    return { local: '0' + digits.slice(2), e164: '+' + digits }
  }
  if (digits.length === 9) {
    return { local: '0' + digits, e164: '+94' + digits }
  }
  if (digits.startsWith('0') && digits.length === 10) {
    return { local: digits, e164: '+94' + digits.slice(1) }
  }

  return { local: phoneStr, e164: phoneStr }
}

export async function checkDuplicateCustomer(
  supabase: any,
  payload: {
    mobile?: string
    whatsapp?: string
    nic?: string
    passport_number?: string
    email?: string
  },
  excludeId?: string
) {
  const normMobile = normalizePhone(payload.mobile).local
  const normWhatsapp = normalizePhone(payload.whatsapp).local

  let query = supabase.from('customers').select('id, customer_code, full_name, mobile, whatsapp, nic, passport_number, email').eq('is_archived', false)

  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const orConditions: string[] = []
  if (normMobile) orConditions.push(`mobile.ilike.%${normMobile}%`)
  if (normWhatsapp) orConditions.push(`whatsapp.ilike.%${normWhatsapp}%`)
  if (payload.nic?.trim()) orConditions.push(`nic.ilike.${payload.nic.trim()}`)
  if (payload.passport_number?.trim()) orConditions.push(`passport_number.ilike.${payload.passport_number.trim()}`)
  if (payload.email?.trim()) orConditions.push(`email.ilike.${payload.email.trim()}`)

  if (orConditions.length === 0) return null

  query = query.or(orConditions.join(','))
  const { data } = await query.limit(1)

  return (data || [])[0] || null
}

export async function getCustomerSummaryKPIs(supabase: any): Promise<CustomerKPIs> {
  const todayStr = getColomboTodayString()
  const monthStart = `${todayStr.slice(0, 7)}-01`

  const [customersRes, bookingsRes, invoicesRes] = await Promise.all([
    supabase
      .from('customers')
      .select('id, status, risk_flag, created_at')
      .eq('is_archived', false),

    supabase
      .from('bookings')
      .select('customer_id, status')
      .eq('status', 'completed')
      .eq('is_archived', false),

    supabase
      .from('invoices')
      .select('customer_id, balance_due')
      .in('status', ['unpaid', 'partially_paid', 'overdue']),
  ])

  const customers = customersRes.data || []
  const completedBookings = bookingsRes.data || []
  const unpaidInvoices = invoicesRes.data || []

  // Count Completed Rentals per Customer
  const bookingCounts: Record<string, number> = {}
  completedBookings.forEach((b: any) => {
    if (b.customer_id) bookingCounts[b.customer_id] = (bookingCounts[b.customer_id] || 0) + 1
  })

  // Count Outstanding Invoices per Customer
  const outstandingCustomerIds = new Set<string>()
  unpaidInvoices.forEach((inv: any) => {
    if (inv.customer_id && Number(inv.balance_due || 0) > 0) {
      outstandingCustomerIds.add(inv.customer_id)
    }
  })

  let totalCustomers = customers.length
  let activeCustomers = 0
  let repeatCustomers = 0
  let newThisMonth = 0
  let riskWatchCount = 0

  customers.forEach((c: any) => {
    if (c.status === 'active') activeCustomers++
    if (c.risk_flag === 'watch' || c.risk_flag === 'restricted') riskWatchCount++
    if (c.created_at && String(c.created_at).slice(0, 10) >= monthStart) newThisMonth++

    const completedCount = bookingCounts[c.id] || 0
    if (completedCount >= 2) repeatCustomers++
  })

  return {
    totalCustomers,
    activeCustomers,
    repeatCustomers,
    newThisMonth,
    outstandingCustomersCount: outstandingCustomerIds.size,
    riskWatchCount,
  }
}

export async function getCustomer360Profile(supabase: any, customerId: string) {
  // 1. Base Customer Record
  const { data: customer, error } = await supabase
    .from('customers')
    .select('*, preferred_vehicle:vehicles(vehicle_name)')
    .eq('id', customerId)
    .single()

  if (error || !customer) {
    return null
  }

  // 2. Parallel Sub-queries for 360 View
  const [quotationsRes, bookingsRes, agreementsRes, invoicesRes, paymentsRes, documentsRes, notesRes, leadsRes] = await Promise.all([
    supabase.from('quotations').select('id, quotation_number, quotation_date, grand_total, status, created_at').eq('customer_id', customerId).order('created_at', { ascending: false }),
    supabase.from('bookings').select('id, booking_number, rental_start_at, rental_end_at, grand_total, status, created_at').eq('customer_id', customerId).order('created_at', { ascending: false }),
    supabase.from('rental_agreements').select('id, agreement_number, status, created_at').eq('customer_id', customerId).order('created_at', { ascending: false }),
    supabase.from('invoices').select('id, invoice_number, grand_total, amount_paid, balance_due, status, invoice_date').eq('customer_id', customerId).order('created_at', { ascending: false }),
    supabase.from('payments').select('id, reference_number, amount, payment_date, payment_method, status').eq('customer_id', customerId).eq('status', 'completed').order('payment_date', { ascending: false }),
    supabase.from('customer_documents').select('*').eq('customer_id', customerId).order('created_at', { ascending: false }),
    supabase.from('customer_notes').select('*, author:profiles(full_name)').eq('customer_id', customerId).order('created_at', { ascending: false }),
    supabase.from('crm_leads').select('id, lead_number, prospect_name, source, status, priority, created_at').eq('customer_id', customerId).order('created_at', { ascending: false }),
  ])

  const quotations = quotationsRes.data || []
  const bookings = bookingsRes.data || []
  const agreements = agreementsRes.data || []
  const invoices = invoicesRes.data || []
  const payments = paymentsRes.data || []
  const documents = documentsRes.data || []
  const notes = notesRes.data || []
  const leads = leadsRes.data || []

  // Authoritative Financial Calculations
  const totalInvoiced = invoices.reduce((acc: number, inv: any) => acc + Number(inv.grand_total || 0), 0)
  const collectedLifetimeValue = payments.reduce((acc: number, p: any) => acc + Number(p.amount || 0), 0)
  const outstandingBalance = invoices.reduce((acc: number, inv: any) => acc + Number(inv.balance_due || 0), 0)
  const overdueBalance = invoices
    .filter((inv: any) => inv.status === 'overdue')
    .reduce((acc: number, inv: any) => acc + Number(inv.balance_due || 0), 0)

  // Derived Rental Stats
  const completedBookingsCount = bookings.filter((b: any) => ['completed', 'closed'].includes(b.status)).length
  const isRepeatCustomer = completedBookingsCount >= 2

  return {
    customer,
    quotations,
    bookings,
    agreements,
    invoices,
    payments,
    documents,
    notes,
    leads,
    financials: {
      totalInvoiced,
      collectedLifetimeValue,
      outstandingBalance,
      overdueBalance,
    },
    stats: {
      completedRentals: completedBookingsCount,
      totalBookings: bookings.length,
      isRepeatCustomer,
    },
  }
}

export async function getLeadPipelineKPIs(supabase: any): Promise<LeadKPIs> {
  const { data: leads } = await supabase.from('crm_leads').select('status')
  const leadList = leads || []
  const totalLeads = leadList.length

  let newLeads = 0
  let contactedLeads = 0
  let qualifiedLeads = 0
  let quotationsSent = 0
  let wonLeads = 0
  let lostLeads = 0

  leadList.forEach((l: any) => {
    if (l.status === 'new') newLeads++
    else if (l.status === 'contacted') contactedLeads++
    else if (l.status === 'qualified') qualifiedLeads++
    else if (l.status === 'quotation_sent' || l.status === 'negotiating') quotationsSent++
    else if (l.status === 'won') wonLeads++
    else if (l.status === 'lost') lostLeads++
  })

  const conversionRate = totalLeads > 0 ? Number(((wonLeads / totalLeads) * 100).toFixed(1)) : 0

  return {
    totalLeads,
    newLeads,
    contactedLeads,
    qualifiedLeads,
    quotationsSent,
    wonLeads,
    lostLeads,
    conversionRate,
  }
}
