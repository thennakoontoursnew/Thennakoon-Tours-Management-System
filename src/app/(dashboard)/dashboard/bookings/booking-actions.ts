'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { bookingSchema, sanitizePayload } from '@/lib/validations/sales-documents'
import { z } from 'zod'

type BookingInput = z.infer<typeof bookingSchema>

export async function checkAvailabilityAction(vehicleId: string, startAt: string, endAt: string, excludeBookingId?: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('check_vehicle_availability', {
      p_vehicle_id: vehicleId,
      p_start_at: startAt,
      p_end_at: endAt,
      p_exclude_booking_id: excludeBookingId || null,
    })

    if (error || !data || data.length === 0) {
      return { isAvailable: true, conflictReason: 'Available' }
    }

    return {
      isAvailable: data[0].is_available,
      conflictReason: data[0].conflict_reason,
      conflictingBookingNumber: data[0].conflicting_booking_number,
    }
  } catch (err: any) {
    return { isAvailable: false, conflictReason: err.message }
  }
}

export async function createBooking(values: BookingInput) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated.' }

    const parsed = bookingSchema.safeParse(values)
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

    const { vehicles, ...headerData } = parsed.data

    // Check availability for each assigned vehicle
    for (const v of vehicles) {
      const avail = await checkAvailabilityAction(v.vehicle_id, v.rental_start_at, v.rental_end_at)
      if (!avail.isAvailable) {
        return { success: false, error: `Vehicle availability conflict: ${avail.conflictReason}` }
      }
    }

    let subtotal = 0
    let deposit = 0
    const processedVehicles = vehicles.map((v) => {
      const lineTotal = Number(v.vehicle_rate) + Number(v.driver_charge)
      subtotal += lineTotal
      deposit += Number(v.deposit_amount)
      return {
        ...v,
      }
    })

    const grandTotal = Math.max(0, subtotal - Number(headerData.discount_amount) + Number(headerData.tax_amount) + deposit)

    const sanitizedHeader = sanitizePayload(headerData)
    const payload = {
      ...sanitizedHeader,
      subtotal,
      refundable_deposit: deposit,
      grand_total: grandTotal,
      balance_due: grandTotal - Number(headerData.advance_required),
      created_by: user.id,
      updated_by: user.id,
    }

    const { data: booking, error: bError } = await supabase
      .from('bookings')
      .insert(payload)
      .select()
      .single()

    if (bError || !booking) return { success: false, error: bError?.message || 'Failed to create booking.' }

    // Insert booking vehicles
    const vRows = processedVehicles.map((v) => ({
      booking_id: booking.id,
      ...sanitizePayload(v),
    }))

    const { error: vError } = await supabase.from('booking_vehicles').insert(vRows)
    if (vError) {
      await supabase.from('bookings').delete().eq('id', booking.id)
      return { success: false, error: `Failed to insert booking vehicles: ${vError.message}` }
    }

    await supabase.rpc('log_audit_action_internal', {
      p_action: 'CREATE_BOOKING',
      p_entity_type: 'booking',
      p_entity_id: booking.id,
      p_description: `Created booking ${booking.booking_number}`,
    })

    revalidatePath('/dashboard/bookings')
    revalidatePath('/dashboard')
    return { success: true, bookingId: booking.id }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create booking.' }
  }
}

export async function updateBookingStatus(id: string, newStatus: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated.' }

    const updatePayload: any = { status: newStatus, updated_by: user.id }
    if (newStatus === 'confirmed') updatePayload.confirmed_at = new Date().toISOString()
    if (newStatus === 'completed') updatePayload.completed_at = new Date().toISOString()
    if (newStatus === 'cancelled') updatePayload.cancelled_at = new Date().toISOString()

    const { error } = await supabase
      .from('bookings')
      .update(updatePayload)
      .eq('id', id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/dashboard/bookings')
    revalidatePath(`/dashboard/bookings/${id}`)
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function checkDriverAvailabilityAction(driverId: string, startAt: string, endAt: string, excludeBookingVehicleId?: string) {
  try {
    const supabase = await createClient()

    const { data: driver, error: dErr } = await supabase
      .from('drivers')
      .select('*')
      .eq('id', driverId)
      .single()

    if (dErr || !driver) {
      return { isAvailable: false, conflictReason: 'Driver record not found.' }
    }

    if (driver.is_archived) {
      return { isAvailable: false, conflictReason: 'Driver profile is archived.' }
    }

    if (driver.status === 'suspended' || driver.status === 'off_duty') {
      return { isAvailable: false, conflictReason: `Driver status is currently ${driver.status}.` }
    }

    if (driver.license_expiry && new Date(driver.license_expiry) < new Date()) {
      return { isAvailable: false, conflictReason: `Driving license expired on ${driver.license_expiry}.` }
    }

    const { data: overlappingBvs } = await supabase
      .from('booking_vehicles')
      .select('id, booking:bookings(id, booking_number, status, rental_start_at, rental_end_at)')
      .eq('driver_id', driverId)

    if (overlappingBvs && overlappingBvs.length > 0) {
      for (const item of overlappingBvs) {
        if (excludeBookingVehicleId && item.id === excludeBookingVehicleId) continue
        const b = item.booking as any
        if (b && b.status !== 'cancelled') {
          const bStart = new Date(b.rental_start_at).getTime()
          const bEnd = new Date(b.rental_end_at).getTime()
          const tStart = new Date(startAt).getTime()
          const tEnd = new Date(endAt).getTime()

          if (tStart < bEnd && tEnd > bStart) {
            return {
              isAvailable: false,
              conflictReason: `Driver is already assigned to Booking ${b.booking_number} (${new Date(b.rental_start_at).toLocaleDateString()} to ${new Date(b.rental_end_at).toLocaleDateString()}).`,
            }
          }
        }
      }
    }

    return { isAvailable: true, conflictReason: 'Available' }
  } catch (err: any) {
    return { isAvailable: false, conflictReason: err.message || 'Driver availability check failed.' }
  }
}

export async function assignBookingVehicleDriver(bookingVehicleId: string, bookingId: string, driverId: string | null) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated.' }

    const { data: booking, error: bErr } = await supabase
      .from('bookings')
      .select('id, booking_number, rental_start_at, rental_end_at')
      .eq('id', bookingId)
      .single()

    if (bErr || !booking) return { success: false, error: 'Booking not found.' }

    const { data: bv, error: bvErr } = await supabase
      .from('booking_vehicles')
      .select('id, vehicle:vehicles(vehicle_name, registration_number)')
      .eq('id', bookingVehicleId)
      .single()

    if (bvErr || !bv) return { success: false, error: 'Booking vehicle allocation record not found.' }

    if (driverId) {
      const avail = await checkDriverAvailabilityAction(driverId, booking.rental_start_at, booking.rental_end_at, bookingVehicleId)
      if (!avail.isAvailable) {
        return { success: false, error: avail.conflictReason }
      }
    }

    const { error: updateErr } = await supabase
      .from('booking_vehicles')
      .update({ driver_id: driverId, updated_at: new Date().toISOString() })
      .eq('id', bookingVehicleId)

    if (updateErr) return { success: false, error: updateErr.message }

    let driverName = 'None'
    if (driverId) {
      const { data: drv } = await supabase.from('drivers').select('full_name, driver_code').eq('id', driverId).single()
      if (drv) driverName = `${drv.full_name} (${drv.driver_code})`
    }

    const vehName = (bv.vehicle as any)?.vehicle_name || 'Vehicle'
    await supabase.from('document_activity_logs').insert({
      document_type: 'booking',
      document_id: bookingId,
      action: driverId ? 'ASSIGN_DRIVER' : 'REMOVE_DRIVER',
      change_summary: driverId ? `Assigned driver ${driverName} to ${vehName}` : `Removed assigned driver from ${vehName}`,
      metadata: { booking_vehicle_id: bookingVehicleId, driver_id: driverId },
      user_id: user.id,
    })

    await supabase.rpc('log_audit_action_internal', {
      p_action: driverId ? 'ASSIGN_DRIVER' : 'REMOVE_DRIVER',
      p_entity_type: 'booking',
      p_entity_id: bookingId,
      p_description: `Driver ${driverName} assigned to vehicle in booking ${booking.booking_number}`,
    })

    revalidatePath(`/dashboard/bookings/${bookingId}`)
    revalidatePath('/dashboard/bookings')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update driver assignment.' }
  }
}
