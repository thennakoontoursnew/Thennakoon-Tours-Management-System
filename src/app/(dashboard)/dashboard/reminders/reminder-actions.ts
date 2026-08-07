'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createManualReminderAction(reminderData: any) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const remNum = `REM-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`

  const { error } = await supabase.from('reminders').insert({
    reminder_number: remNum,
    reminder_type: reminderData.reminder_type || 'general',
    entity_type: reminderData.entity_type || 'general',
    entity_id: reminderData.entity_id || null,
    title: reminderData.title,
    message: reminderData.message || reminderData.title,
    priority: reminderData.priority || 'normal',
    due_at: reminderData.due_at || new Date().toISOString(),
    status: 'pending',
    assigned_to: reminderData.assigned_to || user?.id || null,
    source: 'manual',
    created_by: user?.id || null,
  })

  if (error) {
    throw new Error(`Failed to create reminder: ${error.message}`)
  }

  revalidatePath('/dashboard/reminders')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function markReminderCompleteAction(reminderId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('reminders')
    .update({
      status: 'completed',
      completed_by: user?.id || null,
      completed_at: new Date().toISOString(),
    })
    .eq('id', reminderId)

  if (error) {
    throw new Error(`Failed to complete reminder: ${error.message}`)
  }

  revalidatePath('/dashboard/reminders')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function dismissReminderAction(reminderId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('reminders')
    .update({
      status: 'dismissed',
      dismissed_by: user?.id || null,
      dismissed_at: new Date().toISOString(),
    })
    .eq('id', reminderId)

  if (error) {
    throw new Error(`Failed to dismiss reminder: ${error.message}`)
  }

  revalidatePath('/dashboard/reminders')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function logCommunicationAction(logData: any) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { error } = await supabase.from('communication_logs').insert({
    channel: logData.channel || 'whatsapp',
    recipient_type: logData.recipient_type || 'customer',
    recipient_id: logData.recipient_id || null,
    recipient_address: logData.recipient_address,
    template_key: logData.template_key || null,
    subject: logData.subject || null,
    message: logData.message,
    entity_type: logData.entity_type || null,
    entity_id: logData.entity_id || null,
    status: logData.status || 'opened',
    opened_at: new Date().toISOString(),
    created_by: user?.id || null,
  })

  if (error) {
    console.error('Failed to record communication log:', error)
  }

  revalidatePath('/dashboard/communication/whatsapp')
  return { success: true }
}
