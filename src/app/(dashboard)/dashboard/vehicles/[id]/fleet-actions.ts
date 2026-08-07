'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function logOdometerAction(
  vehicleId: string,
  newOdometer: number,
  sourceType: string,
  notes?: string,
  isOwnerOverride?: boolean
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

  // Fetch current vehicle mileage
  const { data: veh } = await supabase.from('vehicles').select('current_mileage').eq('id', vehicleId).single()
  const currentMile = Number(veh?.current_mileage || 0)

  if (newOdometer < currentMile && userRole !== 'owner' && !isOwnerOverride) {
    throw new Error(`New odometer reading (${newOdometer.toLocaleString()} KM) cannot be less than current odometer (${currentMile.toLocaleString()} KM). Owner override required.`)
  }

  // Insert Odometer Log
  await supabase.from('vehicle_odometer_logs').insert({
    vehicle_id: vehicleId,
    odometer: newOdometer,
    source_type: sourceType,
    notes: notes || null,
    recorded_by: user?.id || null,
  })

  // Update current_mileage on vehicles table
  await supabase.from('vehicles').update({ current_mileage: newOdometer }).eq('id', vehicleId)

  // Log activity
  await supabase.from('document_activity_logs').insert({
    document_type: 'vehicle',
    document_id: vehicleId,
    action: 'ODOMETER_UPDATED',
    change_summary: `Updated odometer from ${currentMile.toLocaleString()} KM to ${newOdometer.toLocaleString()} KM via ${sourceType}`,
    user_id: user?.id || null,
  })

  revalidatePath(`/dashboard/vehicles/${vehicleId}`)
  revalidatePath('/dashboard/vehicles')
  return { success: true }
}

export async function addVehicleDocumentAction(docData: any) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { error } = await supabase.from('vehicle_documents').insert({
    vehicle_id: docData.vehicle_id,
    document_type: docData.document_type,
    document_number: docData.document_number || null,
    issue_date: docData.issue_date || null,
    expiry_date: docData.expiry_date,
    provider: docData.provider || null,
    notes: docData.notes || null,
    status: 'valid',
  })

  if (error) {
    throw new Error(`Failed to save vehicle document: ${error.message}`)
  }

  // Log activity
  await supabase.from('document_activity_logs').insert({
    document_type: 'vehicle',
    document_id: docData.vehicle_id,
    action: 'DOCUMENT_ADDED',
    change_summary: `Added ${docData.document_type.replace('_', ' ')} (Expires: ${docData.expiry_date})`,
    user_id: user?.id || null,
  })

  revalidatePath(`/dashboard/vehicles/${docData.vehicle_id}`)
  return { success: true }
}
