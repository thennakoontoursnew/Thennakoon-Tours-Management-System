'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { transitionBookingStatus, BookingStatus } from '@/lib/bookings/booking-workflow'

export async function executeBookingTransitionAction(
  bookingId: string,
  targetStatus: BookingStatus,
  payload?: any
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let userRole = 'viewer'
  if (user?.id) {
    const { data: prof } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
    if (prof?.role) userRole = prof.role
  }

  const result = await transitionBookingStatus(supabase, bookingId, targetStatus, user?.id, {
    ...payload,
    isOwner: userRole === 'owner',
  })

  if (result.success) {
    revalidatePath(`/dashboard/bookings/${bookingId}`)
    revalidatePath('/dashboard/bookings')
    revalidatePath('/dashboard')
  }

  return result
}

export async function addBookingExtraChargeAction(bookingId: string, chargeData: any) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { error } = await supabase.from('booking_charges').insert({
    booking_id: bookingId,
    charge_type: chargeData.charge_type,
    description: chargeData.description,
    quantity: chargeData.quantity,
    unit_amount: chargeData.unit_amount,
    amount: chargeData.amount,
    status: chargeData.status || 'pending',
    created_by: user?.id || null,
  })

  if (error) {
    throw new Error(`Failed to add extra charge: ${error.message}`)
  }

  // Write Document Activity Log
  await supabase.from('document_activity_logs').insert({
    document_type: 'booking',
    document_id: bookingId,
    action: 'EXTRA_CHARGE_ADDED',
    change_summary: `Added extra charge: ${chargeData.description} (LKR ${Number(chargeData.amount).toLocaleString()})`,
    user_id: user?.id || null,
  })

  revalidatePath(`/dashboard/bookings/${bookingId}`)
  return { success: true }
}
