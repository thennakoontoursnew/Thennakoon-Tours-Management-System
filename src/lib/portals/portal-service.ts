import { getColomboTodayString } from '@/lib/utils/colombo-date-utils'

export async function getCustomerPortalData(supabase: any, customerId?: string) {
  if (!customerId) {
    // Return sample/aggregated customer overview if no specific customer ID
    const { data: customers } = await supabase.from('customers').select('id, full_name, mobile, email').limit(20)
    const { data: bookings } = await supabase.from('bookings').select('*, customer:customers(full_name)').order('created_at', { ascending: false }).limit(20)
    const { data: invoices } = await supabase.from('invoices').select('*, customer:customers(full_name)').order('created_at', { ascending: false }).limit(20)

    return {
      customers: customers || [],
      activeBookings: (bookings || []).filter((b: any) => !['closed', 'cancelled'].includes(b.status)),
      pastBookings: (bookings || []).filter((b: any) => ['closed', 'cancelled'].includes(b.status)),
      invoices: invoices || [],
      totalOutstanding: (invoices || []).reduce((sum: number, i: any) => sum + Number(i.balance_due || 0), 0),
    }
  }

  // Fetch specific customer data
  const [customerRes, bookingsRes, quotationsRes, invoicesRes, docsRes, notifsRes] = await Promise.all([
    supabase.from('customers').select('*').eq('id', customerId).single(),
    supabase.from('bookings').select('*, booking_vehicles(vehicle:vehicles(vehicle_name, registration_number))').eq('customer_id', customerId).order('created_at', { ascending: false }),
    supabase.from('quotations').select('*').eq('customer_id', customerId).order('created_at', { ascending: false }),
    supabase.from('invoices').select('*').eq('customer_id', customerId).order('created_at', { ascending: false }),
    supabase.from('customer_documents').select('*').eq('customer_id', customerId),
    supabase.from('portal_notifications').select('*').eq('recipient_type', 'customer').eq('recipient_id', customerId).order('created_at', { ascending: false }),
  ])

  const bookings = bookingsRes.data || []
  const invoices = invoicesRes.data || []

  return {
    customer: customerRes.data,
    activeBookings: bookings.filter((b: any) => !['closed', 'cancelled'].includes(b.status)),
    pastBookings: bookings.filter((b: any) => ['closed', 'cancelled'].includes(b.status)),
    quotations: quotationsRes.data || [],
    invoices,
    documents: docsRes.data || [],
    notifications: notifsRes.data || [],
    totalOutstanding: invoices.reduce((sum: number, i: any) => sum + Number(i.balance_due || 0), 0),
  }
}

export async function getDriverPortalData(supabase: any, driverId?: string) {
  const todayStr = getColomboTodayString()

  if (!driverId) {
    // Return aggregate driver roster & trip schedule
    const { data: drivers } = await supabase.from('drivers').select('id, full_name, mobile, status').limit(20)
    const { data: trips } = await supabase.from('booking_vehicles').select('*, booking:bookings(booking_number, rental_start_at, rental_end_at, status, pickup_location, dropoff_location, customer:customers(full_name, mobile)), vehicle:vehicles(vehicle_name, registration_number)').order('created_at', { ascending: false }).limit(20)

    return {
      drivers: drivers || [],
      assignedTrips: trips || [],
      todayTrips: (trips || []).filter((t: any) => t.booking?.rental_start_at?.slice(0, 10) === todayStr),
    }
  }

  // Fetch specific driver duty portal data
  const [driverRes, tripsRes, docsRes, incidentsRes] = await Promise.all([
    supabase.from('drivers').select('*').eq('id', driverId).single(),
    supabase.from('booking_vehicles').select('*, booking:bookings(booking_number, rental_start_at, rental_end_at, status, pickup_location, dropoff_location, customer:customers(full_name, mobile)), vehicle:vehicles(vehicle_name, registration_number)').eq('driver_id', driverId).order('created_at', { ascending: false }),
    supabase.from('driver_documents').select('*').eq('driver_id', driverId),
    supabase.from('driver_incidents').select('*').eq('driver_id', driverId).order('incident_date', { ascending: false }),
  ])

  const trips = tripsRes.data || []

  return {
    driver: driverRes.data,
    activeTrips: trips.filter((t: any) => ['confirmed', 'ready', 'in_progress', 'on_trip'].includes(t.booking?.status)),
    pastTrips: trips.filter((t: any) => ['closed', 'completed'].includes(t.booking?.status)),
    todayTrips: trips.filter((t: any) => t.booking?.rental_start_at?.slice(0, 10) === todayStr),
    documents: docsRes.data || [],
    incidents: incidentsRes.data || [],
  }
}

export async function getOwnerPortalData(supabase: any, ownerId?: string) {
  if (!ownerId) {
    const { data: owners } = await supabase.from('vehicle_owners').select('*').order('full_name', { ascending: true })
    const { data: vehicles } = await supabase.from('vehicles').select('*, owner:vehicle_owners(full_name)').not('vehicle_owner_id', 'is', null)
    const { data: payouts } = await supabase.from('owner_payouts').select('*, owner:vehicle_owners(full_name)').order('created_at', { ascending: false })

    return {
      owners: owners || [],
      vehicles: vehicles || [],
      payouts: payouts || [],
      totalPaid: (payouts || []).filter((p: any) => p.status === 'paid').reduce((s: number, p: any) => s + Number(p.net_payout || 0), 0),
      totalPending: (payouts || []).filter((p: any) => p.status === 'pending' || p.status === 'approved').reduce((s: number, p: any) => s + Number(p.net_payout || 0), 0),
    }
  }

  const [ownerRes, vehiclesRes, payoutsRes, statementsRes] = await Promise.all([
    supabase.from('vehicle_owners').select('*').eq('id', ownerId).single(),
    supabase.from('vehicles').select('*').eq('vehicle_owner_id', ownerId),
    supabase.from('owner_payouts').select('*').eq('vehicle_owner_id', ownerId).order('period_start', { ascending: false }),
    supabase.from('owner_statements').select('*').eq('vehicle_owner_id', ownerId).order('period_start', { ascending: false }),
  ])

  const payouts = payoutsRes.data || []

  return {
    owner: ownerRes.data,
    vehicles: vehiclesRes.data || [],
    payouts,
    statements: statementsRes.data || [],
    totalPaid: payouts.filter((p: any) => p.status === 'paid').reduce((s: number, p: any) => s + Number(p.net_payout || 0), 0),
    totalPending: payouts.filter((p: any) => p.status === 'pending' || p.status === 'approved').reduce((s: number, p: any) => s + Number(p.net_payout || 0), 0),
  }
}
