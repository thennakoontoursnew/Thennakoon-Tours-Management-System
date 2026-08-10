'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Helper for self-booking request sequence (SBR-YYYY-XXXXXX)
async function getNextSelfBookingNumber(supabase: any) {
  try {
    const { data } = await supabase.rpc('generate_next_self_booking_number')
    if (data) return data
  } catch (_) {}
  return `SBR-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`
}

// =============================================
// CREATE CUSTOMER SELF-BOOKING REQUEST
// =============================================
export async function createSelfBookingRequestAction(data: any) {
  const supabase = await createClient()

  const sbrNum = await getNextSelfBookingNumber(supabase)

  const { data: request, error } = await supabase
    .from('customer_self_bookings')
    .insert({
      request_number: sbrNum,
      customer_id: data.customer_id || null,
      customer_name: data.customer_name,
      customer_mobile: data.customer_mobile,
      customer_email: data.customer_email || null,
      vehicle_category_id: data.vehicle_category_id || null,
      vehicle_id: data.vehicle_id || null,
      pickup_location: data.pickup_location,
      dropoff_location: data.dropoff_location,
      rental_start_date: data.rental_start_date,
      rental_end_date: data.rental_end_date,
      passenger_count: Number(data.passenger_count || 1),
      with_driver: data.with_driver !== undefined ? Boolean(data.with_driver) : true,
      estimated_amount: Number(data.estimated_amount || 0),
      status: 'pending',
      notes: data.notes || null,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/dashboard/portals/customer')
  revalidatePath('/dashboard/bookings')
  return { success: true, request }
}

// =============================================
// APPROVE & CONVERT SELF-BOOKING TO ACTIVE BOOKING
// =============================================
export async function approveSelfBookingRequestAction(requestId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: request } = await supabase.from('customer_self_bookings').select('*').eq('id', requestId).single()
  if (!request) return { error: 'Self booking request not found' }

  // Generate Booking Number
  let bookingNum = `BK-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`
  try {
    const { data } = await supabase.rpc('generate_next_booking_number')
    if (data) bookingNum = data
  } catch (_) {}

  // 1. Create Booking Record
  const { data: booking, error: bErr } = await supabase
    .from('bookings')
    .insert({
      booking_number: bookingNum,
      customer_id: request.customer_id || null,
      rental_start_at: `${request.rental_start_date}T09:00:00.000Z`,
      rental_end_at: `${request.rental_end_date}T18:00:00.000Z`,
      pickup_location: request.pickup_location,
      dropoff_location: request.dropoff_location,
      passenger_count: request.passenger_count,
      status: 'confirmed',
      booking_source: 'self_booking',
      self_booking_status: 'approved',
      grand_total: request.estimated_amount,
      notes: request.notes || `Self-booking request ${request.request_number}`,
      created_by: user.id,
    })
    .select()
    .single()

  if (bErr) return { error: bErr.message }

  // 2. Link booking vehicle if specified
  if (request.vehicle_id && booking?.id) {
    await supabase.from('booking_vehicles').insert({
      booking_id: booking.id,
      vehicle_id: request.vehicle_id,
    })
  }

  // 3. Update Request status
  await supabase
    .from('customer_self_bookings')
    .update({ status: 'converted', converted_booking_id: booking.id, updated_at: new Date().toISOString() })
    .eq('id', requestId)

  revalidatePath('/dashboard/portals/customer')
  revalidatePath('/dashboard/bookings')
  return { success: true, booking }
}

// =============================================
// TOGGLE CUSTOMER PORTAL ACCESS
// =============================================
export async function toggleCustomerPortalAccessAction(customerId: string, isActive: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('customers')
    .update({ is_portal_active: isActive })
    .eq('id', customerId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/portals/customer')
  return { success: true }
}

// =============================================
// TOGGLE DRIVER PORTAL ACCESS
// =============================================
export async function toggleDriverPortalAccessAction(driverId: string, isActive: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('drivers')
    .update({ is_portal_active: isActive })
    .eq('id', driverId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/portals/driver')
  return { success: true }
}
