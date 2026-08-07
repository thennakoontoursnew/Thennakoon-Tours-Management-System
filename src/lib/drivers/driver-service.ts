import { getColomboTodayString, getColomboDayBounds } from '@/lib/utils/colombo-date-utils'
import { calculateDocumentHealth } from '@/lib/fleet/fleet-service'

export interface DriverKPIs {
  totalDrivers: number
  available: number
  assigned: number
  onTrip: number
  onLeave: number
  unavailable: number
  expiringDocumentsCount: number
}

export interface DriverAvailabilityResult {
  isAvailable: boolean
  reason?: string
  nextAvailableAt?: string
}

export async function calculateDriverAvailability(
  supabase: any,
  driverId: string,
  startIso?: string,
  endIso?: string
): Promise<DriverAvailabilityResult> {
  const todayStr = getColomboTodayString()
  const bounds = getColomboDayBounds(todayStr)
  const targetStart = startIso || bounds.startIso
  const targetEnd = endIso || bounds.endIso

  // 1. Fetch Driver record
  const { data: driver, error } = await supabase
    .from('drivers')
    .select('id, status, is_archived, license_expiry, police_clearance_expiry, medical_expiry')
    .eq('id', driverId)
    .single()

  if (error || !driver) {
    return { isAvailable: false, reason: 'Driver record not found' }
  }

  if (driver.is_archived || driver.status === 'inactive') {
    return { isAvailable: false, reason: 'Driver is inactive or archived' }
  }

  // 2. Check Document Compliance (Driving License, Police Clearance, Medical)
  const licHealth = calculateDocumentHealth(driver.license_expiry)
  if (licHealth.status === 'expired') {
    return { isAvailable: false, reason: `Driving License Expired (${driver.license_expiry})` }
  }

  if (driver.police_clearance_expiry) {
    const polHealth = calculateDocumentHealth(driver.police_clearance_expiry)
    if (polHealth.status === 'expired') {
      return { isAvailable: false, reason: `Police Clearance Expired (${driver.police_clearance_expiry})` }
    }
  }

  if (driver.medical_expiry) {
    const medHealth = calculateDocumentHealth(driver.medical_expiry)
    if (medHealth.status === 'expired') {
      return { isAvailable: false, reason: `Medical Certificate Expired (${driver.medical_expiry})` }
    }
  }

  // 3. Check Unavailability / Leave periods
  const { data: leaves } = await supabase
    .from('driver_unavailability')
    .select('id, start_at, end_at, unavailability_type, reason')
    .eq('driver_id', driverId)
    .eq('status', 'active')
    .lte('start_at', targetEnd)
    .gte('end_at', targetStart)

  if (leaves && leaves.length > 0) {
    const leave = leaves[0]
    return {
      isAvailable: false,
      reason: `On Leave (${leave.unavailability_type.replace('_', ' ')}) until ${new Date(leave.end_at).toLocaleDateString()}`,
      nextAvailableAt: leave.end_at,
    }
  }

  // 4. Check Overlapping Active Booking Assignments
  const { data: bVehicles } = await supabase
    .from('booking_vehicles')
    .select('id, booking:bookings!inner(id, booking_number, rental_start_at, rental_end_at, status)')
    .eq('driver_id', driverId)
    .lte('booking.rental_start_at', targetEnd)
    .gte('booking.rental_end_at', targetStart)
    .in('booking.status', ['confirmed', 'ready', 'in_progress', 'on_trip'])

  const activeAssignments = (bVehicles || []).filter((bv: any) => bv.booking)
  if (activeAssignments.length > 0) {
    const bk = activeAssignments[0].booking
    return {
      isAvailable: false,
      reason: `Assigned to Booking ${bk.booking_number} (${bk.status})`,
      nextAvailableAt: bk.rental_end_at,
    }
  }

  return { isAvailable: true }
}

export async function getDriverSummaryKPIs(supabase: any): Promise<DriverKPIs> {
  const todayStr = getColomboTodayString()
  const todayBounds = getColomboDayBounds(todayStr)

  const [driversRes, activeAssignmentsRes] = await Promise.all([
    supabase
      .from('drivers')
      .select('id, status, license_expiry, police_clearance_expiry, medical_expiry')
      .eq('is_archived', false),

    supabase
      .from('booking_vehicles')
      .select('driver_id, booking:bookings!inner(status, rental_start_at, rental_end_at)')
      .lte('booking.rental_start_at', todayBounds.endIso)
      .gte('booking.rental_end_at', todayBounds.startIso)
      .in('booking.status', ['confirmed', 'ready', 'in_progress', 'on_trip']),
  ])

  const drivers = driversRes.data || []
  const activeAssignments = activeAssignmentsRes.data || []

  const activeDriverIdsOnTrip = new Set<string>()
  activeAssignments.forEach((bv: any) => {
    if (bv.driver_id) activeDriverIdsOnTrip.add(bv.driver_id)
  })

  let totalDrivers = drivers.length
  let available = 0
  let assigned = 0
  let onTrip = 0
  let onLeave = 0
  let unavailable = 0
  let expiringDocumentsCount = 0

  drivers.forEach((d: any) => {
    const st = d.status || 'available'
    const isOnTrip = activeDriverIdsOnTrip.has(d.id) || st === 'on_trip'

    if (st === 'inactive' || st === 'unavailable') {
      unavailable++
    } else if (st === 'on_leave') {
      onLeave++
    } else if (isOnTrip) {
      onTrip++
    } else if (st === 'assigned') {
      assigned++
    } else {
      available++
    }

    // Document Health Alerts
    const h1 = calculateDocumentHealth(d.license_expiry)
    const h2 = calculateDocumentHealth(d.police_clearance_expiry)
    const h3 = calculateDocumentHealth(d.medical_expiry)

    if (h1.status === 'expired' || h1.status === 'expiring_soon') expiringDocumentsCount++
    else if (h2.status === 'expired' || h2.status === 'expiring_soon') expiringDocumentsCount++
    else if (h3.status === 'expired' || h3.status === 'expiring_soon') expiringDocumentsCount++
  })

  return {
    totalDrivers,
    available,
    assigned,
    onTrip,
    onLeave,
    unavailable,
    expiringDocumentsCount,
  }
}

export async function getDriver360Profile(supabase: any, driverId: string) {
  // 1. Fetch Driver Base Record
  const { data: driver, error } = await supabase
    .from('drivers')
    .select('*')
    .eq('id', driverId)
    .single()

  if (error || !driver) {
    return null
  }

  // 2. Sub-queries for Assignments, Documents, Leaves, Incidents, Notes
  const [bVehiclesRes, documentsRes, leavesRes, incidentsRes, notesRes] = await Promise.all([
    supabase
      .from('booking_vehicles')
      .select('id, booking_id, vehicle_id, booking:bookings!inner(id, booking_number, rental_start_at, rental_end_at, status, is_archived, customer:customers(full_name)), vehicle:vehicles(vehicle_name, registration_number)')
      .eq('driver_id', driverId)
      .order('created_at', { ascending: false }),

    supabase.from('driver_documents').select('*').eq('driver_id', driverId).order('expiry_date', { ascending: true }),
    supabase.from('driver_unavailability').select('*').eq('driver_id', driverId).order('start_at', { ascending: false }),
    supabase.from('driver_incidents').select('*, booking:bookings(booking_number)').eq('driver_id', driverId).order('incident_date', { ascending: false }),
    supabase.from('driver_notes').select('*, author:profiles(full_name)').eq('driver_id', driverId).order('created_at', { ascending: false }),
  ])

  const assignments = (bVehiclesRes.data || []).filter((bv: any) => !bv.booking.is_archived)
  const documents = documentsRes.data || []
  const leaves = leavesRes.data || []
  const incidents = incidentsRes.data || []
  const notes = notesRes.data || []

  // Determine Current and Next Booking Assignment
  const todayStr = getColomboTodayString()
  const todayBounds = getColomboDayBounds(todayStr)

  let currentBooking: any = null
  let nextBooking: any = null

  const validAssignments = assignments
    .filter((bv: any) => !['cancelled', 'no_show', 'closed'].includes(bv.booking.status))
    .sort((a: any, b: any) => new Date(a.booking.rental_start_at).getTime() - new Date(b.booking.rental_start_at).getTime())

  validAssignments.forEach((bv: any) => {
    const startIso = bv.booking.rental_start_at
    const endIso = bv.booking.rental_end_at

    if (startIso <= todayBounds.endIso && endIso >= todayBounds.startIso) {
      if (!currentBooking) currentBooking = bv
    } else if (startIso > todayBounds.endIso) {
      if (!nextBooking) nextBooking = bv
    }
  })

  // Performance Stats
  const completedTrips = assignments.filter((bv: any) => ['completed', 'closed'].includes(bv.booking.status)).length
  const cancelledTrips = assignments.filter((bv: any) => bv.booking.status === 'cancelled').length

  return {
    driver,
    assignments,
    currentBooking,
    nextBooking,
    documents,
    leaves,
    incidents,
    notes,
    stats: {
      totalAssignedTrips: assignments.length,
      completedTrips,
      cancelledTrips,
      incidentsCount: incidents.length,
    },
  }
}
