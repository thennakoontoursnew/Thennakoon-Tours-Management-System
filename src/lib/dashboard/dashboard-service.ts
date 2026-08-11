import { createClient } from '@/lib/supabase/server'

export interface KPIOverview {
  totalRevenue: number
  monthRevenue: number
  revenueGrowthPct: number | null
  activeBookingsCount: number
  todayPickupsCount: number
  availableVehiclesCount: number
  totalFleetCount: number
  outstandingBalance: number
  overdueBalance: number
  totalCustomersCount: number
  activeDriversCount: number
}

export interface RevenueSeriesPoint {
  date: string
  label: string
  collected: number
  invoiced: number
}

export interface RevenueSummary {
  totalInvoiced: number
  totalCollected: number
  outstanding: number
  collectionRate: number
}

export interface FleetStatusItem {
  status: string
  label: string
  count: number
  color: string
}

export interface OperationalBookingRecord {
  id: string
  booking_number: string
  customer_name: string
  vehicle_name: string
  start_date: string
  end_date: string
  pickup_location?: string
  dropoff_location?: string
  driver_name?: string
  status: string
}

export interface TodayOperationsData {
  pickups: OperationalBookingRecord[]
  returns: OperationalBookingRecord[]
  activeTrips: OperationalBookingRecord[]
  driverMissing: OperationalBookingRecord[]
}

export interface CalendarEvent {
  id: string
  booking_number: string
  customer_name: string
  vehicle_name: string
  start_date: string
  end_date: string
  status: string
}

export interface DashboardAlert {
  id: string
  priority: 'critical' | 'warning' | 'info'
  title: string
  description: string
  bookingId?: string
  vehicleId?: string
  invoiceId?: string
}

export interface DashboardActivity {
  id: string
  document_type: string
  document_id: string
  action: string
  change_summary: string
  user_name: string
  created_at: string
}

// Utility: Date string YYYY-MM-DD in Asia/Colombo timezone
export function getColomboTodayString(): string {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Colombo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }
  const parts = new Intl.DateTimeFormat('en-CA', options).formatToParts(new Date())
  const year = parts.find((p) => p.type === 'year')?.value || '2026'
  const month = parts.find((p) => p.type === 'month')?.value || '08'
  const day = parts.find((p) => p.type === 'day')?.value || '07'
  return `${year}-${month}-${day}`
}

// Utility: ISO Start & End timestamps for Asia/Colombo timezone (+05:30)
export function getColomboDayBounds(dateStr?: string) {
  const targetDateStr = dateStr || getColomboTodayString()
  const startIso = `${targetDateStr}T00:00:00.000+05:30`
  const endIso = `${targetDateStr}T23:59:59.999+05:30`
  return { startIso, endIso, targetDateStr }
}

export function getColomboHour(): number {
  return Number(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Colombo',
      hour: 'numeric',
      hour12: false,
    }).format(new Date())
  )
}

export function getGreeting(): string {
  const hour = getColomboHour()
  if (hour < 12) return 'Good Morning'
  if (hour < 18) return 'Good Afternoon'
  return 'Good Evening'
}

export async function getDashboardHeaderData(userId?: string) {
  const supabase = await createClient()

  let fullName = 'Team Member'
  let role = 'viewer'

  if (userId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', userId)
      .maybeSingle()
    if (profile) {
      fullName = profile.full_name || fullName
      role = profile.role || role
    }
  }

  const todayStr = getColomboTodayString()
  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Colombo',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date())

  return {
    greeting: getGreeting(),
    firstName: fullName.split(' ')[0],
    fullName,
    role,
    todayStr,
    todayFormatted,
  }
}

export async function getDashboardKPIs(userRole: string): Promise<KPIOverview> {
  const supabase = await createClient()
  const todayStr = getColomboTodayString()
  const todayBounds = getColomboDayBounds(todayStr)

  const isFinanceAuthorized = ['owner', 'admin', 'manager', 'finance_staff'].includes(userRole)

  // Run queries in parallel
  const [
    paymentsRes,
    monthPaymentsRes,
    prevMonthPaymentsRes,
    bookingsRes,
    todayPickupsRes,
    vehiclesRes,
    availableVehiclesRes,
    invoicesRes,
    overdueInvoicesRes,
    customersRes,
    driversRes,
  ] = await Promise.all([
    // Completed Payments Total Revenue
    isFinanceAuthorized
      ? supabase.from('payments').select('amount').eq('status', 'completed')
      : Promise.resolve({ data: [] }),

    // Current Month Payments
    isFinanceAuthorized
      ? supabase
          .from('payments')
          .select('amount')
          .eq('status', 'completed')
          .gte('payment_date', `${todayStr.slice(0, 7)}-01T00:00:00.000+05:30`)
      : Promise.resolve({ data: [] }),

    // Previous Month Payments
    isFinanceAuthorized
      ? (() => {
          const year = parseInt(todayStr.slice(0, 4))
          const month = parseInt(todayStr.slice(5, 7))
          const prevYear = month === 1 ? year - 1 : year
          const prevMonth = month === 1 ? 12 : month - 1
          const prevMonthStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}`
          const nextMonthStr = `${year}-${String(month).padStart(2, '0')}`
          return supabase
            .from('payments')
            .select('amount')
            .eq('status', 'completed')
            .gte('payment_date', `${prevMonthStr}-01T00:00:00.000+05:30`)
            .lt('payment_date', `${nextMonthStr}-01T00:00:00.000+05:30`)
        })()
      : Promise.resolve({ data: [] }),

    // Active Bookings Count
    supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .in('status', ['confirmed', 'in_progress', 'on_trip'])
      .eq('is_archived', false),

    // Today Pickups Count (rental_start_at between startIso and endIso)
    supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .gte('rental_start_at', todayBounds.startIso)
      .lte('rental_start_at', todayBounds.endIso)
      .eq('is_archived', false),

    // Total Fleet Count
    supabase
      .from('vehicles')
      .select('*', { count: 'exact', head: true })
      .eq('is_archived', false),

    // Available Vehicles Count
    supabase
      .from('vehicles')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'available')
      .eq('is_archived', false),

    // Outstanding Invoices Balance
    isFinanceAuthorized
      ? supabase
          .from('invoices')
          .select('balance_due')
          .in('status', ['unpaid', 'partially_paid', 'overdue'])
      : Promise.resolve({ data: [] }),

    // Overdue Invoices Balance
    isFinanceAuthorized
      ? supabase
          .from('invoices')
          .select('balance_due')
          .eq('status', 'overdue')
      : Promise.resolve({ data: [] }),

    // Customers Count
    supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('is_archived', false),

    // Active Drivers Count
    supabase
      .from('drivers')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .eq('is_archived', false),
  ])

  const totalRevenue = (paymentsRes.data || []).reduce((acc: number, p: any) => acc + Number(p.amount || 0), 0)
  const monthRevenue = (monthPaymentsRes.data || []).reduce((acc: number, p: any) => acc + Number(p.amount || 0), 0)
  const prevMonthRevenue = (prevMonthPaymentsRes.data || []).reduce((acc: number, p: any) => acc + Number(p.amount || 0), 0)

  let revenueGrowthPct: number | null = null
  if (prevMonthRevenue > 0) {
    revenueGrowthPct = Number((((monthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100).toFixed(1))
  }

  const outstandingBalance = (invoicesRes.data || []).reduce((acc: number, inv: any) => acc + Number(inv.balance_due || 0), 0)
  const overdueBalance = (overdueInvoicesRes.data || []).reduce((acc: number, inv: any) => acc + Number(inv.balance_due || 0), 0)

  return {
    totalRevenue,
    monthRevenue,
    revenueGrowthPct,
    activeBookingsCount: bookingsRes.count || 0,
    todayPickupsCount: todayPickupsRes.count || 0,
    availableVehiclesCount: availableVehiclesRes.count || 0,
    totalFleetCount: vehiclesRes.count || 0,
    outstandingBalance,
    overdueBalance,
    totalCustomersCount: customersRes.count || 0,
    activeDriversCount: driversRes.count || 0,
  }
}

export async function getRevenueSeries(periodFilter: string = '30d') {
  const supabase = await createClient()

  // Calculate start date
  const now = new Date()
  let days = 30
  if (periodFilter === '7d') days = 7
  if (periodFilter === '3m') days = 90
  if (periodFilter === '6m') days = 180
  if (periodFilter === 'ytd') days = 365

  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const startIso = `${startDate}T00:00:00.000+05:30`

  const [paymentsRes, invoicesRes] = await Promise.all([
    supabase
      .from('payments')
      .select('amount, payment_date')
      .eq('status', 'completed')
      .gte('payment_date', startIso)
      .order('payment_date', { ascending: true }),

    supabase
      .from('invoices')
      .select('grand_total, amount_paid, balance_due, invoice_date, status')
      .neq('status', 'cancelled')
      .gte('invoice_date', startDate)
      .order('invoice_date', { ascending: true }),
  ])

  const payments = paymentsRes.data || []
  const invoices = invoicesRes.data || []

  const totalInvoiced = invoices.reduce((acc: number, inv: any) => acc + Number(inv.grand_total || 0), 0)
  const totalCollected = payments.reduce((acc: number, p: any) => acc + Number(p.amount || 0), 0)
  const outstanding = invoices.reduce((acc: number, inv: any) => acc + Number(inv.balance_due || 0), 0)
  const collectionRate = totalInvoiced > 0 ? Number(((totalCollected / totalInvoiced) * 100).toFixed(1)) : 0

  const dateMap: Record<string, { collected: number; invoiced: number }> = {}

  payments.forEach((p: any) => {
    const key = String(p.payment_date).slice(0, 10)
    if (!dateMap[key]) dateMap[key] = { collected: 0, invoiced: 0 }
    dateMap[key].collected += Number(p.amount || 0)
  })

  invoices.forEach((inv: any) => {
    const key = String(inv.invoice_date).slice(0, 10)
    if (!dateMap[key]) dateMap[key] = { collected: 0, invoiced: 0 }
    dateMap[key].invoiced += Number(inv.grand_total || 0)
  })

  const sortedDates = Object.keys(dateMap).sort()
  const series: RevenueSeriesPoint[] = sortedDates.map((d) => {
    const dateObj = new Date(d)
    const label = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return {
      date: d,
      label,
      collected: Math.round(dateMap[d].collected),
      invoiced: Math.round(dateMap[d].invoiced),
    }
  })

  return {
    series,
    summary: {
      totalInvoiced,
      totalCollected,
      outstanding,
      collectionRate,
    },
  }
}

export async function getFleetStatus(): Promise<{ items: FleetStatusItem[]; totalFleet: number }> {
  const supabase = await createClient()

  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('status')
    .eq('is_archived', false)

  const vehicleList = vehicles || []
  const totalFleet = vehicleList.length

  const counts: Record<string, number> = {
    available: 0,
    rented: 0,
    on_trip: 0,
    maintenance: 0,
    reserved: 0,
    inactive: 0,
  }

  vehicleList.forEach((v: any) => {
    const st = v.status || 'available'
    counts[st] = (counts[st] || 0) + 1
  })

  const items: FleetStatusItem[] = [
    { status: 'available', label: 'Available', count: counts['available'] || 0, color: 'bg-emerald-500 text-emerald-500' },
    { status: 'on_trip', label: 'On Trip / Rented', count: (counts['on_trip'] || 0) + (counts['rented'] || 0), color: 'bg-amber-500 text-amber-500' },
    { status: 'reserved', label: 'Reserved', count: counts['reserved'] || 0, color: 'bg-blue-500 text-blue-500' },
    { status: 'maintenance', label: 'Maintenance', count: counts['maintenance'] || 0, color: 'bg-rose-500 text-rose-500' },
    { status: 'inactive', label: 'Inactive', count: counts['inactive'] || 0, color: 'bg-slate-400 text-slate-400' },
  ]

  return { items, totalFleet }
}

export async function getTodayOperations(): Promise<TodayOperationsData> {
  const supabase = await createClient()
  const todayStr = getColomboTodayString()
  const todayBounds = getColomboDayBounds(todayStr)

  // Tomorrow Bounds
  const tomorrowObj = new Date()
  tomorrowObj.setDate(tomorrowObj.getDate() + 1)
  const tomorrowStr = tomorrowObj.toISOString().slice(0, 10)
  const tomorrowBounds = getColomboDayBounds(tomorrowStr)

  // Fetch Bookings with customers and booking_vehicles
  const [pickupsRes, returnsRes, activeRes, unassignedVehiclesRes] = await Promise.all([
    // Today's Pickups (rental_start_at)
    supabase
      .from('bookings')
      .select('id, booking_number, rental_start_at, rental_end_at, pickup_location, dropoff_location, status, customer:customers(full_name), booking_vehicles(vehicle:vehicles(vehicle_name, registration_number), driver:drivers(full_name))')
      .gte('rental_start_at', todayBounds.startIso)
      .lte('rental_start_at', todayBounds.endIso)
      .eq('is_archived', false),

    // Today's Returns (rental_end_at)
    supabase
      .from('bookings')
      .select('id, booking_number, rental_start_at, rental_end_at, pickup_location, dropoff_location, status, customer:customers(full_name), booking_vehicles(vehicle:vehicles(vehicle_name, registration_number), driver:drivers(full_name))')
      .gte('rental_end_at', todayBounds.startIso)
      .lte('rental_end_at', todayBounds.endIso)
      .eq('is_archived', false),

    // Active Trips (rental_start_at <= todayBounds.endIso AND rental_end_at >= todayBounds.startIso)
    supabase
      .from('bookings')
      .select('id, booking_number, rental_start_at, rental_end_at, pickup_location, dropoff_location, status, customer:customers(full_name), booking_vehicles(vehicle:vehicles(vehicle_name, registration_number), driver:drivers(full_name))')
      .lte('rental_start_at', todayBounds.endIso)
      .gte('rental_end_at', todayBounds.startIso)
      .eq('is_archived', false),

    // Missing Driver Allocations starting today or tomorrow
    supabase
      .from('booking_vehicles')
      .select('id, booking_id, driver_id, vehicle:vehicles(vehicle_name), booking:bookings!inner(id, booking_number, rental_start_at, rental_end_at, status, is_archived, customer:customers(full_name))')
      .is('driver_id', null)
      .gte('booking.rental_start_at', todayBounds.startIso)
      .lte('booking.rental_start_at', tomorrowBounds.endIso)
      .eq('booking.is_archived', false),
  ])

  const mapBookingRecord = (b: any): OperationalBookingRecord => {
    const bv = (b.booking_vehicles || [])[0] || {}
    const v = bv.vehicle || {}
    const d = bv.driver || {}
    return {
      id: b.id,
      booking_number: b.booking_number,
      customer_name: b.customer?.full_name || 'N/A',
      vehicle_name: v.vehicle_name ? `${v.vehicle_name} (${v.registration_number || ''})` : 'Vehicle Unassigned',
      start_date: String(b.rental_start_at || '').slice(0, 10),
      end_date: String(b.rental_end_at || '').slice(0, 10),
      pickup_location: b.pickup_location || 'Colombo HQ',
      dropoff_location: b.dropoff_location || 'Colombo HQ',
      driver_name: d.full_name || 'Not assigned',
      status: b.status,
    }
  }

  const pickups = (pickupsRes.data || []).map(mapBookingRecord)
  const returns = (returnsRes.data || []).map(mapBookingRecord)
  const activeTrips = (activeRes.data || []).map(mapBookingRecord)

  const driverMissing: OperationalBookingRecord[] = (unassignedVehiclesRes.data || []).map((bv: any) => {
    const b = bv.booking || {}
    return {
      id: b.id,
      booking_number: b.booking_number,
      customer_name: b.customer?.full_name || 'N/A',
      vehicle_name: bv.vehicle?.vehicle_name || 'Unassigned Vehicle',
      start_date: String(b.rental_start_at || '').slice(0, 10),
      end_date: String(b.rental_end_at || '').slice(0, 10),
      driver_name: 'DRIVER MISSING',
      status: b.status,
    }
  })

  return {
    pickups,
    returns,
    activeTrips,
    driverMissing,
  }
}

export async function getBookingCalendar(year: number, month: number): Promise<CalendarEvent[]> {
  const supabase = await createClient()

  const lastDay = new Date(year, month, 0).getDate()
  const monthStartIso = `${year}-${String(month).padStart(2, '0')}-01T00:00:00.000+05:30`
  const monthEndIso = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}T23:59:59.999+05:30`

  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, booking_number, rental_start_at, rental_end_at, status, customer:customers(full_name), booking_vehicles(vehicle:vehicles(vehicle_name))')
    .lte('rental_start_at', monthEndIso)
    .gte('rental_end_at', monthStartIso)
    .eq('is_archived', false)

  return (bookings || []).map((b: any) => {
    const bv = (b.booking_vehicles || [])[0] || {}
    return {
      id: b.id,
      booking_number: b.booking_number,
      customer_name: b.customer?.full_name || 'N/A',
      vehicle_name: bv.vehicle?.vehicle_name || 'Vehicle',
      start_date: String(b.rental_start_at || '').slice(0, 10),
      end_date: String(b.rental_end_at || '').slice(0, 10),
      status: b.status,
    }
  })
}

export async function getDashboardAlerts(): Promise<DashboardAlert[]> {
  const supabase = await createClient()
  const todayStr = getColomboTodayString()
  const todayBounds = getColomboDayBounds(todayStr)

  const alerts: DashboardAlert[] = []

  // Check Driver Missing for Today's Pickups
  const { data: missingDrivers } = await supabase
    .from('booking_vehicles')
    .select('id, booking:bookings!inner(id, booking_number, rental_start_at, customer:customers(full_name))')
    .is('driver_id', null)
    .gte('booking.rental_start_at', todayBounds.startIso)
    .lte('booking.rental_start_at', todayBounds.endIso)
    .eq('booking.is_archived', false)

  ;(missingDrivers || []).forEach((bv: any) => {
    const b = bv.booking || {}
    alerts.push({
      id: `driver-missing-${bv.id}`,
      priority: 'critical',
      title: `Driver Not Assigned (${b.booking_number})`,
      description: `Pickup today for ${b.customer?.full_name || 'Hirer'} requires driver assignment.`,
      bookingId: b.id,
    })
  })

  // Check Overdue Invoices
  const { data: overdueInvoices } = await supabase
    .from('invoices')
    .select('id, invoice_number, balance_due, customer:customers(full_name)')
    .eq('status', 'overdue')
    .limit(5)

  ;(overdueInvoices || []).forEach((inv: any) => {
    alerts.push({
      id: `overdue-${inv.id}`,
      priority: 'warning',
      title: `Overdue Invoice (${inv.invoice_number})`,
      description: `LKR ${Number(inv.balance_due).toLocaleString()} outstanding from ${inv.customer?.full_name || 'Customer'}.`,
      invoiceId: inv.id,
    })
  })

  // Check Vehicles Returning Today
  const { data: todayReturns } = await supabase
    .from('bookings')
    .select('id, booking_number, customer:customers(full_name)')
    .gte('rental_end_at', todayBounds.startIso)
    .lte('rental_end_at', todayBounds.endIso)
    .eq('is_archived', false)

  if (todayReturns && todayReturns.length > 0) {
    alerts.push({
      id: 'today-returns-info',
      priority: 'info',
      title: `${todayReturns.length} Vehicle Return(s) Scheduled Today`,
      description: `Ensure check-in inspections and deposit reconciliations are completed.`,
    })
  }

  return alerts
}

export async function getRecentBookings(limit: number = 5) {
  const supabase = await createClient()

  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, booking_number, rental_start_at, rental_end_at, grand_total, status, created_at, customer:customers(full_name), booking_vehicles(vehicle:vehicles(vehicle_name, registration_number))')
    .eq('is_archived', false)
    .order('created_at', { ascending: false })
    .limit(limit)

  return (bookings || []).map((b: any) => {
    const bv = (b.booking_vehicles || [])[0] || {}
    const v = bv.vehicle || {}
    return {
      id: b.id,
      booking_number: b.booking_number,
      customer_name: b.customer?.full_name || 'N/A',
      vehicle_name: v.vehicle_name ? `${v.vehicle_name} (${v.registration_number || ''})` : 'N/A',
      rental_start_date: String(b.rental_start_at || '').slice(0, 10),
      rental_end_date: String(b.rental_end_at || '').slice(0, 10),
      grand_total: Number(b.grand_total || 0),
      status: b.status,
      created_at: b.created_at,
    }
  })
}

export async function getRecentActivity(limit: number = 8): Promise<DashboardActivity[]> {
  const supabase = await createClient()

  const { data: logs } = await supabase
    .from('document_activity_logs')
    .select('id, document_type, document_id, action, change_summary, created_at, profile:profiles(full_name)')
    .order('created_at', { ascending: false })
    .limit(limit)

  return (logs || []).map((log: any) => ({
    id: log.id,
    document_type: log.document_type,
    document_id: log.document_id,
    action: log.action,
    change_summary: log.change_summary || `${log.action} performed on ${log.document_type}`,
    user_name: log.profile?.full_name || 'System User',
    created_at: log.created_at,
  }))
}
