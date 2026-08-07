export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'ready'
  | 'in_progress'
  | 'on_trip'
  | 'returned'
  | 'completed'
  | 'closed'
  | 'cancelled'
  | 'no_show'

export interface WorkflowTransitionResult {
  success: boolean
  message: string
  newStatus?: BookingStatus
}

export const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  ready: 'Vehicle Ready',
  in_progress: 'On Trip',
  on_trip: 'On Trip',
  returned: 'Vehicle Returned',
  completed: 'Completed',
  closed: 'Closed',
  cancelled: 'Cancelled',
  no_show: 'No Show',
}

export const STATUS_COLORS: Record<BookingStatus, { bg: string; text: string; border: string }> = {
  pending: { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/20' },
  confirmed: { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/20' },
  ready: { bg: 'bg-purple-500/10', text: 'text-purple-500', border: 'border-purple-500/20' },
  in_progress: { bg: 'bg-indigo-500/10', text: 'text-indigo-500', border: 'border-indigo-500/20' },
  on_trip: { bg: 'bg-indigo-500/10', text: 'text-indigo-500', border: 'border-indigo-500/20' },
  returned: { bg: 'bg-cyan-500/10', text: 'text-cyan-500', border: 'border-cyan-500/20' },
  completed: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/20' },
  closed: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20' },
  cancelled: { bg: 'bg-rose-500/10', text: 'text-rose-500', border: 'border-rose-500/20' },
  no_show: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' },
}

// 1. Get Permitted Next Actions
export function getValidNextTransitions(currentStatus: BookingStatus): BookingStatus[] {
  switch (currentStatus) {
    case 'pending':
      return ['confirmed', 'cancelled']
    case 'confirmed':
      return ['ready', 'cancelled', 'no_show']
    case 'ready':
      return ['on_trip', 'cancelled', 'no_show']
    case 'in_progress':
    case 'on_trip':
      return ['returned']
    case 'returned':
      return ['completed']
    case 'completed':
      return ['closed']
    case 'closed':
    case 'cancelled':
    case 'no_show':
    default:
      return []
  }
}

// Helper: Log Document Activity & Audit Log
async function logBookingActivity(
  supabase: any,
  bookingId: string,
  action: string,
  prevStatus: string,
  newStatus: string,
  summary: string,
  userId?: string
) {
  try {
    await supabase.from('document_activity_logs').insert({
      document_type: 'booking',
      document_id: bookingId,
      action,
      previous_status: prevStatus,
      new_status: newStatus,
      change_summary: summary,
      user_id: userId || null,
    })
  } catch (err) {
    console.error('Failed to write activity log:', err)
  }
}

// 2. Main Workflow Transition Handler
export async function transitionBookingStatus(
  supabase: any,
  bookingId: string,
  targetStatus: BookingStatus,
  userId?: string,
  payload?: {
    reason?: string
    overrideReason?: string
    isOwner?: boolean
    handoverData?: any
    returnData?: any
  }
): Promise<WorkflowTransitionResult> {
  // Fetch Booking with vehicles, drivers, customer, and rental agreements
  const { data: booking, error } = await supabase
    .from('bookings')
    .select('*, customer:customers(full_name), booking_vehicles(id, vehicle_id, driver_id, vehicle:vehicles(vehicle_name, status), driver:drivers(full_name, status)), invoices(id, balance_due, status)')
    .eq('id', bookingId)
    .single()

  if (error || !booking) {
    return { success: false, message: 'Booking record not found.' }
  }

  const currentStatus = booking.status as BookingStatus
  const validNext = getValidNextTransitions(currentStatus)

  if (!validNext.includes(targetStatus)) {
    return {
      success: false,
      message: `Invalid status transition from ${STATUS_LABELS[currentStatus]} to ${STATUS_LABELS[targetStatus]}.`,
    }
  }

  const bookingVehicles = booking.booking_vehicles || []

  // --- TRANSITION PREREQUISITE VALIDATIONS & ACTIONS ---

  // A. CONFIRMED -> READY
  if (targetStatus === 'ready') {
    if (bookingVehicles.length === 0) {
      return { success: false, message: 'Cannot mark vehicle ready: No vehicle allocated to this booking.' }
    }

    // Check Driver Requirement
    const missingDriverVehicle = bookingVehicles.find((bv: any) => !bv.driver_id)
    if (missingDriverVehicle) {
      return {
        success: false,
        message: 'Cannot mark vehicle ready: A driver must be assigned to all allocated vehicles before marking ready.',
      }
    }

    // Check if Handover checklist exists
    if (payload?.handoverData) {
      await supabase.from('booking_handover_checks').upsert({
        booking_id: bookingId,
        vehicle_id: bookingVehicles[0]?.vehicle_id || null,
        cleanliness_checked: payload.handoverData.cleanliness_checked ?? true,
        documents_checked: payload.handoverData.documents_checked ?? true,
        insurance_valid: payload.handoverData.insurance_valid ?? true,
        revenue_license_valid: payload.handoverData.revenue_license_valid ?? true,
        emission_test_valid: payload.handoverData.emission_test_valid ?? true,
        tyres_checked: payload.handoverData.tyres_checked ?? true,
        lights_checked: payload.handoverData.lights_checked ?? true,
        fuel_level_percent: payload.handoverData.fuel_level_percent ?? 100,
        odometer_reading: payload.handoverData.odometer_reading ?? 0,
        existing_damage_notes: payload.handoverData.existing_damage_notes || '',
        staff_confirmed_by: userId || null,
      })
    }
  }

  // B. READY -> ON TRIP
  if (targetStatus === 'on_trip') {
    // Record actual pickup timestamp
    await supabase.from('bookings').update({ actual_pickup_at: new Date().toISOString() }).eq('id', bookingId)

    // Synchronize Vehicle status -> 'on_trip'
    for (const bv of bookingVehicles) {
      if (bv.vehicle_id) {
        await supabase.from('vehicles').update({ status: 'on_trip' }).eq('id', bv.vehicle_id)
      }
      if (bv.driver_id) {
        await supabase.from('drivers').update({ status: 'on_trip' }).eq('id', bv.driver_id)
      }
    }
  }

  // C. ON TRIP -> RETURNED
  if (targetStatus === 'returned') {
    if (payload?.returnData) {
      const rd = payload.returnData
      const pickupOdo = Number(rd.pickup_odometer || 0)
      const returnOdo = Number(rd.return_odometer || 0)

      if (returnOdo < pickupOdo) {
        return {
          success: false,
          message: `Return odometer (${returnOdo.toLocaleString()} km) cannot be less than pickup odometer (${pickupOdo.toLocaleString()} km).`,
        }
      }

      const actualKm = Math.max(returnOdo - pickupOdo, 0)
      const allowedKm = Number(rd.allowed_km || 500)
      const extraKm = Math.max(actualKm - allowedKm, 0)
      const extraKmRate = Number(rd.extra_km_rate || 100)
      const extraKmCharge = extraKm * extraKmRate

      // Save Return Inspection
      await supabase.from('booking_return_checks').upsert({
        booking_id: bookingId,
        vehicle_id: bookingVehicles[0]?.vehicle_id || null,
        actual_return_at: new Date().toISOString(),
        pickup_odometer: pickupOdo,
        return_odometer: returnOdo,
        actual_km_driven: actualKm,
        allowed_km: allowedKm,
        extra_km: extraKm,
        extra_km_rate: extraKmRate,
        extra_km_charge: extraKmCharge,
        pickup_fuel_percent: Number(rd.pickup_fuel_percent || 100),
        return_fuel_percent: Number(rd.return_fuel_percent || 100),
        exterior_condition: rd.exterior_condition || 'pass',
        interior_condition: rd.interior_condition || 'pass',
        tyres_condition: rd.tyres_condition || 'pass',
        lights_condition: rd.lights_condition || 'pass',
        glass_condition: rd.glass_condition || 'pass',
        damage_found: Boolean(rd.damage_found),
        damage_description: rd.damage_description || '',
        overall_status: rd.overall_status || (rd.damage_found ? 'damage_found' : 'pass'),
        received_by: userId || null,
        notes: rd.notes || '',
      })

      // If extra KM charge exists, auto-add to booking_charges
      if (extraKmCharge > 0) {
        await supabase.from('booking_charges').insert({
          booking_id: bookingId,
          charge_type: 'extra_km',
          description: `Extra Mileage Charge (${extraKm.toLocaleString()} KM @ LKR ${extraKmRate}/KM)`,
          quantity: extraKm,
          unit_amount: extraKmRate,
          amount: extraKmCharge,
          status: 'pending',
          created_by: userId || null,
        })
      }
    }

    // Set actual_return_at
    await supabase.from('bookings').update({ actual_return_at: new Date().toISOString() }).eq('id', bookingId)

    // Release Vehicle & Driver safely
    for (const bv of bookingVehicles) {
      if (bv.vehicle_id) {
        await supabase.from('vehicles').update({ status: 'available' }).eq('id', bv.vehicle_id)
      }
      if (bv.driver_id) {
        await supabase.from('drivers').update({ status: 'active' }).eq('id', bv.driver_id)
      }
    }
  }

  // D. COMPLETED -> CLOSED
  if (targetStatus === 'closed') {
    const invoices = booking.invoices || []
    const totalBalanceDue = invoices.reduce((acc: number, inv: any) => acc + Number(inv.balance_due || 0), 0)

    if (totalBalanceDue > 0 && !payload?.isOwner) {
      return {
        success: false,
        message: `Cannot close booking with unpaid balance (LKR ${totalBalanceDue.toLocaleString()}). Owner override required to close un-settled booking.`,
      }
    }

    if (totalBalanceDue > 0 && payload?.isOwner && !payload?.overrideReason?.trim()) {
      return {
        success: false,
        message: 'Owner override reason is required to close a booking with an outstanding balance.',
      }
    }

    await supabase
      .from('bookings')
      .update({
        closed_at: new Date().toISOString(),
        closed_by: userId || null,
        override_reason: payload?.overrideReason || null,
      })
      .eq('id', bookingId)
  }

  // E. CANCELLED or NO_SHOW
  if (targetStatus === 'cancelled' || targetStatus === 'no_show') {
    if (!payload?.reason?.trim()) {
      return {
        success: false,
        message: `Reason is required to mark booking as ${STATUS_LABELS[targetStatus]}.`,
      }
    }

    // Insert cancellation log
    await supabase.from('booking_cancellations').insert({
      booking_id: bookingId,
      type: targetStatus === 'no_show' ? 'no_show' : 'cancellation',
      reason: payload.reason,
      notes: payload.handoverData?.notes || '',
      cancelled_by: userId || null,
    })

    // Release Vehicle & Driver safely
    for (const bv of bookingVehicles) {
      if (bv.vehicle_id) {
        await supabase.from('vehicles').update({ status: 'available' }).eq('id', bv.vehicle_id)
      }
      if (bv.driver_id) {
        await supabase.from('drivers').update({ status: 'active' }).eq('id', bv.driver_id)
      }
    }
  }

  // EXECUTE BOOKING STATUS UPDATE
  const { error: updateErr } = await supabase
    .from('bookings')
    .update({ status: targetStatus, updated_at: new Date().toISOString() })
    .eq('id', bookingId)

  if (updateErr) {
    return { success: false, message: `Failed to update booking status: ${updateErr.message}` }
  }

  // LOG ACTIVITY
  await logBookingActivity(
    supabase,
    bookingId,
    `STATUS_CHANGED_${targetStatus.toUpperCase()}`,
    currentStatus,
    targetStatus,
    `Booking status updated from ${STATUS_LABELS[currentStatus]} to ${STATUS_LABELS[targetStatus]}`,
    userId
  )

  return {
    success: true,
    message: `Booking successfully updated to ${STATUS_LABELS[targetStatus]}.`,
    newStatus: targetStatus,
  }
}
