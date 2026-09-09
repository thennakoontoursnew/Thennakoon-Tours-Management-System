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

export interface HealthScoreResult {
  score: number
  rating: 'Excellent' | 'Good' | 'Fair' | 'Needs Attention'
  badgeColor: string
  breakdown: {
    base: number
    servicePenalty: number
    documentPenalty: number
    statusPenalty: number
    maintenancePenalty: number
  }
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

/**
 * Deterministic Fleet Health Score Formula (0 - 100)
 * Base: 100
 * Service Mileage Penalty: -25 if overdue, -10 if due within 500km
 * Document Penalties: -15 per expired doc, -5 per expiring soon doc
 * Status Penalty: -20 if in maintenance, -10 if inspection_required
 */
export function calculateVehicleHealthScore(vehicle: any): HealthScoreResult {
  let score = 100
  let servicePenalty = 0
  let documentPenalty = 0
  let statusPenalty = 0
  let maintenancePenalty = 0

  const curMile = Number(vehicle?.current_mileage || 0)
  const dueMile = Number(vehicle?.service_due_mileage || 0)

  if (dueMile > 0) {
    if (curMile >= dueMile) {
      servicePenalty = 25
    } else if (dueMile - curMile <= 500) {
      servicePenalty = 10
    }
  }

  const hInsurance: DocumentHealthStatus = calculateDocumentHealth(vehicle?.insurance_expiry)
  const hLicense: DocumentHealthStatus = calculateDocumentHealth(vehicle?.revenue_license_expiry)
  const hEmission: DocumentHealthStatus = calculateDocumentHealth(vehicle?.emission_test_expiry)

  const docStatuses: DocumentHealthStatus[] = [hInsurance, hLicense, hEmission]
  docStatuses.forEach((h) => {
    if (h.status === 'expired') documentPenalty += 15
    else if (h.status === 'expiring_soon') documentPenalty += 5
    else if (h.status === 'missing') documentPenalty += 5
  })

  const st = vehicle?.status || 'available'
  if (st === 'maintenance') {
    statusPenalty = 20
  } else if (st === 'inspection_required') {
    statusPenalty = 10
  } else if (st === 'inactive') {
    statusPenalty = 15
  }

  score = Math.max(0, Math.min(100, score - servicePenalty - documentPenalty - statusPenalty - maintenancePenalty))

  let rating: 'Excellent' | 'Good' | 'Fair' | 'Needs Attention' = 'Excellent'
  let badgeColor = 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'

  if (score >= 90) {
    rating = 'Excellent'
    badgeColor = 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
  } else if (score >= 75) {
    rating = 'Good'
    badgeColor = 'bg-blue-500/10 text-blue-500 border-blue-500/20'
  } else if (score >= 50) {
    rating = 'Fair'
    badgeColor = 'bg-amber-500/10 text-amber-500 border-amber-500/20'
  } else {
    rating = 'Needs Attention'
    badgeColor = 'bg-rose-500/10 text-rose-500 border-rose-500/20'
  }

  return {
    score,
    rating,
    badgeColor,
    breakdown: {
      base: 100,
      servicePenalty,
      documentPenalty,
      statusPenalty,
      maintenancePenalty,
    },
  }
}

export function calculateFuelEfficiency(distanceKm: number, liters: number) {
  if (!liters || liters <= 0 || !distanceKm || distanceKm <= 0) {
    return { kmPerLiter: 0, litersPer100km: 0 }
  }
  const kmPerLiter = Number((distanceKm / liters).toFixed(2))
  const litersPer100km = Number(((liters / distanceKm) * 100).toFixed(2))
  return { kmPerLiter, litersPer100km }
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
    } else if (st === 'maintenance' || st === 'inspection_failed') {
      maintenance++
    } else if (st === 'inspection_required' || st === 'pending_inspection') {
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
  try {
    // 1. Fetch Vehicle Record
    const { data: vehicle, error } = await supabase
      .from('vehicles')
      .select('*, vehicle_categories(name)')
      .eq('id', vehicleId)
      .maybeSingle()

    if (error || !vehicle) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[getVehicleProfileData] Error fetching vehicle:', error)
      }
      return null
    }

    vehicle.category = vehicle.vehicle_categories ? { category_name: vehicle.vehicle_categories.name } : null

    if (vehicle.vehicle_owner_id) {
      try {
        const { data: ownerData } = await supabase
          .from('vehicle_owners')
          .select('id, full_name, company_name, owner_number, revenue_share_pct, flat_rate_per_day, mobile')
          .eq('id', vehicle.vehicle_owner_id)
          .maybeSingle()
        vehicle.owner = ownerData || null
      } catch (e) {
        vehicle.owner = null
      }
    }

    // 2. Fetch Booking Allocations for this vehicle safely
    let bVehicles: any[] = []
    try {
      const { data } = await supabase
        .from('booking_vehicles')
        .select('id, booking_id, driver_id, booking:bookings(id, booking_number, rental_start_at, rental_end_at, status, grand_total, is_archived, customer:customers(full_name)), driver:drivers(full_name, mobile)')
        .eq('vehicle_id', vehicleId)
        .order('created_at', { ascending: false })
      if (data) bVehicles = data
    } catch (e) {
      if (process.env.NODE_ENV !== 'production') console.warn('[getVehicleProfileData] bVehicles error:', e)
    }

    const allocations = (bVehicles || []).filter((bv: any) => bv?.booking && !bv.booking.is_archived)

    // Determine Current and Next Booking safely
    const todayStr = getColomboTodayString()
    const todayBounds = getColomboDayBounds(todayStr)

    let currentBooking: any = null
    let nextBooking: any = null

    const activeOrUpcomingBookings = allocations
      .filter((bv: any) => bv?.booking?.status && !['cancelled', 'no_show', 'closed'].includes(bv.booking.status))
      .sort((a: any, b: any) => {
        const tA = a?.booking?.rental_start_at ? new Date(a.booking.rental_start_at).getTime() : 0
        const tB = b?.booking?.rental_start_at ? new Date(b.booking.rental_start_at).getTime() : 0
        return tA - tB
      })

    activeOrUpcomingBookings.forEach((bv: any) => {
      const startIso = bv?.booking?.rental_start_at || ''
      const endIso = bv?.booking?.rental_end_at || ''

      if (startIso && endIso) {
        if (startIso <= todayBounds.endIso && endIso >= todayBounds.startIso) {
          if (!currentBooking) currentBooking = bv
        } else if (startIso > todayBounds.endIso) {
          if (!nextBooking) nextBooking = bv
        }
      }
    })

    // 3. Fetch Vehicle Odometer Logs safely
    let odoLogs: any[] = []
    try {
      const { data } = await supabase
        .from('vehicle_odometer_logs')
        .select('id, odometer, source_type, notes, recorded_at, recorder:profiles(full_name)')
        .eq('vehicle_id', vehicleId)
        .order('recorded_at', { ascending: false })
      if (data) odoLogs = data
    } catch (e) {}

    // 4. Fetch Vehicle Documents safely
    let documents: any[] = []
    try {
      const { data } = await supabase
        .from('vehicle_documents')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('expiry_date', { ascending: true })
      if (data) documents = data
    } catch (e) {}

    // 5. Fetch Vehicle Photos safely
    let photos: any[] = []
    try {
      const { data } = await supabase
        .from('vehicle_photos')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('uploaded_at', { ascending: false })
      if (data) photos = data
    } catch (e) {}

    // 6. Fetch Maintenance Records safely
    let maintenance: any[] = []
    try {
      const { data } = await supabase
        .from('maintenance_records')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('service_date', { ascending: false })
      if (data) maintenance = data
    } catch (e) {}

    // 7. Fetch Fuel Logs safely
    let fuelLogs: any[] = []
    try {
      const { data } = await supabase
        .from('fuel_logs')
        .select('*, driver:drivers(full_name)')
        .eq('vehicle_id', vehicleId)
        .order('log_date', { ascending: false })
      if (data) fuelLogs = data
    } catch (e) {}

    // 8. Fetch Status History safely
    let statusHistory: any[] = []
    try {
      const { data } = await supabase
        .from('vehicle_status_history')
        .select('*, changed_by_profile:profiles(full_name)')
        .eq('vehicle_id', vehicleId)
        .order('changed_at', { ascending: false })
      if (data) statusHistory = data
    } catch (e) {}

    // 9. Fetch Owner Payouts safely
    let ownerPayouts: any[] = []
    try {
      const { data } = await supabase
        .from('owner_payouts')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('period_start', { ascending: false })
      if (data) ownerPayouts = data
    } catch (e) {}

    // 10. Fetch Vehicle Return Checks / Inspections safely
    let returnChecks: any[] = []
    try {
      const { data } = await supabase
        .from('vehicle_return_checks')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('created_at', { ascending: false })
      if (data) returnChecks = data
    } catch (e) {}

    // 11. Financial Contribution Calculation
    const bookingIds = Array.from(new Set(allocations.map((bv: any) => bv.booking_id).filter(Boolean)))
    let collectedRevenue = 0
    let invoicedRevenue = 0

    if (bookingIds.length > 0) {
      try {
        const [paymentsRes, invoicesRes] = await Promise.all([
          supabase.from('payments').select('amount').in('booking_id', bookingIds).eq('status', 'completed'),
          supabase.from('invoices').select('grand_total').in('booking_id', bookingIds).neq('status', 'cancelled'),
        ])

        collectedRevenue = (paymentsRes.data || []).reduce((acc: number, p: any) => acc + Number(p.amount || 0), 0)
        invoicedRevenue = (invoicesRes.data || []).reduce((acc: number, inv: any) => acc + Number(inv.grand_total || 0), 0)
      } catch (e) {}
    }

    const totalMaintenanceCost = (maintenance || []).reduce((acc: number, m: any) => acc + Number(m.cost || 0), 0)
    const totalFuelCost = (fuelLogs || []).reduce((acc: number, f: any) => acc + Number(f.total_cost || 0), 0)
    const totalFuelLiters = (fuelLogs || []).reduce((acc: number, f: any) => acc + Number(f.liters || 0), 0)
    const totalOwnerPayoutCost = (ownerPayouts || [])
      .filter((p: any) => p?.status === 'paid' || p?.status === 'approved')
      .reduce((acc: number, p: any) => acc + Number(p.net_payout || 0), 0)

    // Overall Fuel Efficiency
    let avgKmPerLiter = 0
    let avgLitersPer100km = 0
    if (totalFuelLiters > 0 && odoLogs && odoLogs.length >= 2) {
      const maxOdo = Number(odoLogs[0]?.odometer || 0)
      const minOdo = Number(odoLogs[odoLogs.length - 1]?.odometer || 0)
      const dist = maxOdo - minOdo
      if (dist > 0) {
        const eff = calculateFuelEfficiency(dist, totalFuelLiters)
        avgKmPerLiter = eff.kmPerLiter
        avgLitersPer100km = eff.litersPer100km
      }
    }

    const healthScore = calculateVehicleHealthScore(vehicle)

    return {
      vehicle,
      allocations: allocations || [],
      currentBooking,
      nextBooking,
      odometerLogs: odoLogs || [],
      documents: documents || [],
      photos: photos || [],
      maintenance: maintenance || [],
      fuelLogs: fuelLogs || [],
      statusHistory: statusHistory || [],
      ownerPayouts: ownerPayouts || [],
      returnChecks: returnChecks || [],
      healthScore,
      financials: {
        collectedRevenue,
        invoicedRevenue,
        totalMaintenanceCost,
        totalFuelCost,
        totalFuelLiters,
        totalOwnerPayoutCost,
        netContribution: collectedRevenue - totalMaintenanceCost - totalFuelCost - totalOwnerPayoutCost,
        avgKmPerLiter,
        avgLitersPer100km,
      },
    }
  } catch (globalErr: any) {
    console.error('[getVehicleProfileData] Unhandled exception:', globalErr)
    return null
  }
}
