'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addDriverLeaveAction(driverId: string, leaveData: any) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Insert leave / unavailability record
  const { error } = await supabase.from('driver_unavailability').insert({
    driver_id: driverId,
    start_at: leaveData.start_at,
    end_at: leaveData.end_at,
    unavailability_type: leaveData.unavailability_type,
    reason: leaveData.reason || null,
    notes: leaveData.notes || null,
    status: 'active',
    created_by: user?.id || null,
  })

  if (error) {
    throw new Error(`Failed to set driver unavailability: ${error.message}`)
  }

  // Synchronize driver status to on_leave if current date falls within range
  const todayIso = new Date().toISOString()
  if (leaveData.start_at <= todayIso && leaveData.end_at >= todayIso) {
    await supabase.from('drivers').update({ status: 'on_leave' }).eq('id', driverId)
  }

  // Audit log
  await supabase.from('document_activity_logs').insert({
    document_type: 'driver',
    document_id: driverId,
    action: 'DRIVER_LEAVE_ADDED',
    change_summary: `Set unavailability (${leaveData.unavailability_type}): ${leaveData.start_at.slice(0, 10)} → ${leaveData.end_at.slice(0, 10)}`,
    user_id: user?.id || null,
  })

  revalidatePath(`/dashboard/drivers/${driverId}`)
  revalidatePath('/dashboard/drivers')
  return { success: true }
}

export async function addDriverIncidentAction(driverId: string, incidentData: any) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { error } = await supabase.from('driver_incidents').insert({
    driver_id: driverId,
    booking_id: incidentData.booking_id || null,
    incident_date: incidentData.incident_date || new Date().toISOString().slice(0, 10),
    incident_type: incidentData.incident_type,
    severity: incidentData.severity || 'minor',
    description: incidentData.description,
    action_taken: incidentData.action_taken || null,
    status: 'open',
    created_by: user?.id || null,
  })

  if (error) {
    throw new Error(`Failed to log driver incident: ${error.message}`)
  }

  // Audit log
  await supabase.from('document_activity_logs').insert({
    document_type: 'driver',
    document_id: driverId,
    action: 'DRIVER_INCIDENT_ADDED',
    change_summary: `Logged incident (${incidentData.incident_type}): ${incidentData.description.slice(0, 50)}...`,
    user_id: user?.id || null,
  })

  revalidatePath(`/dashboard/drivers/${driverId}`)
  return { success: true }
}

export async function addDriverNoteAction(driverId: string, note: string, noteType: string, isImportant: boolean) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { error } = await supabase.from('driver_notes').insert({
    driver_id: driverId,
    note,
    note_type: noteType,
    is_important: isImportant,
    created_by: user?.id || null,
  })

  if (error) {
    throw new Error(`Failed to save driver note: ${error.message}`)
  }

  revalidatePath(`/dashboard/drivers/${driverId}`)
  return { success: true }
}

export async function addDriverDocumentAction(driverId: string, docData: any) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { error } = await supabase.from('driver_documents').insert({
    driver_id: driverId,
    document_type: docData.document_type,
    document_number: docData.document_number || null,
    issue_date: docData.issue_date || null,
    expiry_date: docData.expiry_date || null,
    notes: docData.notes || null,
    created_by: user?.id || null,
  })

  if (error) {
    throw new Error(`Failed to save driver document: ${error.message}`)
  }

  revalidatePath(`/dashboard/drivers/${driverId}`)
  return { success: true }
}
