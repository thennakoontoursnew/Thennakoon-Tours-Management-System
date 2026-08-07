import { getColomboTodayString, getColomboDayBounds } from '@/lib/utils/colombo-date-utils'

export interface FleetKPIs {
  totalFleet: number
  available: number
  reserved: number
  onTrip: number
  maintenance: number
  inspectionRequired: number
  inactive: number
  expiringDocumentsCount: number
  maintenanceDueCount: number
}

export interface DocumentHealthStatus {
  status: 'valid' | 'expiring_soon' | 'expired' | 'missing'
  daysRemaining?: number
  badgeColor: string
  label: string
}

export function normalizeRegistrationNumber(regStr: string): string {
  if (!regStr) return ''
  return regStr.toUpperCase().replace(/\s+/g, ' ').trim()
}

export function calculateDocumentHealth(expiryDateStr?: string | null): DocumentHealthStatus {
  if (!expiryDateStr) {
    return { status: 'missing', label: 'Missing Date', badgeColor: 'bg-slate-500/10 text-slate-400 border-slate-500/20' }
  }

  const todayStr = getColomboTodayString()
  const today = new Date(todayStr)
  const expiry = new Date(expiryDateStr)

  const diffTime = expiry.getTime() - today.getTime()
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (daysRemaining < 0) {
    return {
      status: 'expired',
      daysRemaining,
      label: `Expired (${Math.abs(daysRemaining)}d ago)`,
      badgeColor: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    }
  }

  if (daysRemaining <= 30) {
    return {
      status: 'expiring_soon',
      daysRemaining,
      label: `Expires in ${daysRemaining}d`,
      badgeColor: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    }
  }

  return {
    status: 'valid',
    daysRemaining,
    label: `Valid (${daysRemaining}d)`,
    badgeColor: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  }
}

export async function getFleetSummaryKPIs(supabase: any): Promise<FleetKPIs> {
  const todayStr = getColomboTodayString()
  const todayBounds = getColomboDayBounds(todayStr)

  const [vehiclesRes, activeTripsRes, expiringDocsRes] = await Promise.all([
    supabase
      .from('vehicles')
      .select('id, status, service_due_mileage, current_mileage, next_service_date, insurance_expiry, revenue_license_expiry, emission_test_expiry')
      .eq('is_archived', false),

    supabase
      .from('bookings')
      .select('id, booking_number, rental_start_at, rental_end_at, status, booking_vehicles(vehicle_id)')
      .lte('rental_start_at', todayBounds.endIso)
      .gte('rental_end_at', todayBounds.startIso)
      .in('status', ['confirmed', 'ready', 'in_progress', 'on_trip'])
      .eq('is_archived', false),

    supabase
      .from('vehicle_documents')
      .select('id, expiry_date')
      .lte('expiry_date', `${todayStr.slice(0, 4)}-12-31`),
  ])

  const vehicles = vehiclesRes.data || []
  const activeBookings = activeTripsRes.data || []

  const activeVehicleIdsOnTrip = new Set<string>()
  activeBookings.forEach((b: any) => {
    (b.booking_vehicles || []).forEach((bv: any) => {
      if (bv.vehicle_id) activeVehicleIdsOnTrip.add(bv.vehicle_id)
    })
  })

  let totalFleet = vehicles.length
  let available = 0
  let reserved = 0
  let onTrip = 0
  let maintenance = 0
  let inspectionRequired = 0
  let inactive = 0
  let maintenanceDueCount = 0

  vehicles.forEach((v: any) => {
    const st = v.status || 'available'
    const isOnTrip = activeVehicleIdsOnTrip.has(v.id) || st === 'on_trip' || st === 'rented'

    if (st === 'inactive') {
      inactive++
    } else if (st === 'maintenance') {
      maintenance++
    } else if (st === 'inspection_required') {
      inspectionRequired++
    } else if (isOnTrip) {
      onTrip++
    } else if (st === 'reserved') {
      reserved++
    } else {
      available++
    }

    // Check Service Due
    const curMileage = Number(v.current_mileage || 0)
    const serviceMileage = Number(v.service_due_mileage || 0)
    if (serviceMileage > 0 && serviceMileage - curMileage <= 500) {
      maintenanceDueCount++
    } else if (v.next_service_date && v.next_service_date <= todayStr) {
      maintenanceDueCount++
    }
  })

  // Count expiring documents in generic table and vehicle columns
  let expiringDocumentsCount = 0
  vehicles.forEach((v: any) => {
    const h1 = calculateDocumentHealth(v.insurance_expiry)
    const h2 = calculateDocumentHealth(v.revenue_license_expiry)
    const h3 = calculateDocumentHealth(v.emission_test_expiry)

    if (h1.status === 'expired' || h1.status === 'expiring_soon') expiringDocumentsCount++
    else if (h2.status === 'expired' || h2.status === 'expiring_soon') expiringDocumentsCount++
    else if (h3.status === 'expired' || h3.status === 'expiring_soon') expiringDocumentsCount++
  })

  return {
    totalFleet,
    available,
    reserved,
    onTrip,
    maintenance,
    inspectionRequired,
    inactive,
    expiringDocumentsCount,
    maintenanceDueCount,
  }
}

export async function getVehicleProfileData(supabase: any, vehicleId: string) {
  // 1. Fetch Vehicle Record
  const { data: vehicle, error } = await supabase
    .from('vehicles')
    .select('*, category:vehicle_categories(category_name)')
    .eq('id', vehicleId)
    .single()

  if (error || !vehicle) {
    return null
  }

  // 2. Fetch Booking Allocations for this vehicle
  const { data: bVehicles } = await supabase
    .from('booking_vehicles')
    .select('id, booking_id, driver_id, booking:bookings!inner(id, booking_number, rental_start_at, rental_end_at, status, grand_total, is_archived, customer:customers(full_name)), driver:drivers(full_name, mobile)')
    .eq('vehicle_id', vehicleId)
    .order('created_at', { ascending: false })

  const allocations = (bVehicles || []).filter((bv: any) => !bv.booking.is_archived)

  // Determine Current and Next Booking
  const todayStr = getColomboTodayString()
  const todayBounds = getColomboDayBounds(todayStr)

  let currentBooking: any = null
  let nextBooking: any = null

  const activeOrUpcomingBookings = allocations
    .filter((bv: any) => !['cancelled', 'no_show', 'closed'].includes(bv.booking.status))
    .sort((a: any, b: any) => new Date(a.booking.rental_start_at).getTime() - new Date(b.booking.rental_start_at).getTime())

  activeOrUpcomingBookings.forEach((bv: any) => {
    const startIso = bv.booking.rental_start_at
    const endIso = bv.booking.rental_end_at

    if (startIso <= todayBounds.endIso && endIso >= todayBounds.startIso) {
      if (!currentBooking) currentBooking = bv
    } else if (startIso > todayBounds.endIso) {
      if (!nextBooking) nextBooking = bv
    }
  })

  // 3. Fetch Vehicle Odometer Logs
  const { data: odoLogs } = await supabase
    .from('vehicle_odometer_logs')
    .select('id, odometer, source_type, notes, recorded_at, recorder:profiles(full_name)')
    .eq('vehicle_id', vehicleId)
    .order('recorded_at', { ascending: false })

  // 4. Fetch Vehicle Documents
  const { data: documents } = await supabase
    .from('vehicle_documents')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('expiry_date', { ascending: true })

  // 5. Fetch Vehicle Photos
  const { data: photos } = await supabase
    .from('vehicle_photos')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('uploaded_at', { ascending: false })

  // 6. Fetch Maintenance Records
  const { data: maintenance } = await supabase
    .from('maintenance_records')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('service_date', { ascending: false })

  // 7. Fetch Inspection Checks (Handover & Return)
  const { data: returnChecks } = await supabase
    .from('booking_return_checks')
    .select('*, booking:bookings(booking_number)')
    .eq('vehicle_id', vehicleId)
    .order('created_at', { ascending: false })

  // 8. Financial Contribution Calculation
  const bookingIds = Array.from(new Set(allocations.map((bv: any) => bv.booking_id)))
  let collectedRevenue = 0
  let invoicedRevenue = 0

  if (bookingIds.length > 0) {
    const [paymentsRes, invoicesRes] = await Promise.all([
      supabase.from('payments').select('amount').in('booking_id', bookingIds).eq('status', 'completed'),
      supabase.from('invoices').select('grand_total').in('booking_id', bookingIds).neq('status', 'cancelled'),
    ])

    collectedRevenue = (paymentsRes.data || []).reduce((acc: number, p: any) => acc + Number(p.amount || 0), 0)
    invoicedRevenue = (invoicesRes.data || []).reduce((acc: number, inv: any) => acc + Number(inv.grand_total || 0), 0)
  }

  const totalMaintenanceCost = (maintenance || []).reduce((acc: number, m: any) => acc + Number(m.cost || 0), 0)

  return {
    vehicle,
    allocations,
    currentBooking,
    nextBooking,
    odometerLogs: odoLogs || [],
    documents: documents || [],
    photos: photos || [],
    maintenance: maintenance || [],
    returnChecks: returnChecks || [],
    financials: {
      collectedRevenue,
      invoicedRevenue,
      totalMaintenanceCost,
      netContribution: collectedRevenue - totalMaintenanceCost,
    },
  }
}
