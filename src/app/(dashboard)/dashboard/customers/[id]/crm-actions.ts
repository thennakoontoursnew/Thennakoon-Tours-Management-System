'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addCustomerNoteAction(
  customerId: string,
  note: string,
  noteType: string,
  isImportant: boolean
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { error } = await supabase.from('customer_notes').insert({
    customer_id: customerId,
    note,
    note_type: noteType,
    is_important: isImportant,
    created_by: user?.id || null,
  })

  if (error) {
    throw new Error(`Failed to save customer note: ${error.message}`)
  }

  // Audit log
  await supabase.from('document_activity_logs').insert({
    document_type: 'customer',
    document_id: customerId,
    action: 'CUSTOMER_NOTE_ADDED',
    change_summary: `Added ${noteType} note (${isImportant ? 'Important' : 'Normal'}): ${note.slice(0, 50)}...`,
    user_id: user?.id || null,
  })

  revalidatePath(`/dashboard/customers/${customerId}`)
  return { success: true }
}

export async function addCustomerDocumentAction(customerId: string, docData: any) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { error } = await supabase.from('customer_documents').insert({
    customer_id: customerId,
    document_type: docData.document_type,
    document_number: docData.document_number || null,
    issue_date: docData.issue_date || null,
    expiry_date: docData.expiry_date || null,
    notes: docData.notes || null,
    created_by: user?.id || null,
  })

  if (error) {
    throw new Error(`Failed to save verification document: ${error.message}`)
  }

  // Audit log
  await supabase.from('document_activity_logs').insert({
    document_type: 'customer',
    document_id: customerId,
    action: 'CUSTOMER_DOCUMENT_ADDED',
    change_summary: `Added verification document: ${docData.document_type.replace('_', ' ')}`,
    user_id: user?.id || null,
  })

  revalidatePath(`/dashboard/customers/${customerId}`)
  return { success: true }
}

export async function updateCustomerRiskAction(customerId: string, riskFlag: string, riskReason?: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('customers')
    .update({
      risk_flag: riskFlag,
      risk_reason: riskReason || null,
      risk_set_by: user?.id || null,
      risk_set_at: new Date().toISOString(),
    })
    .eq('id', customerId)

  if (error) {
    throw new Error(`Failed to update risk status: ${error.message}`)
  }

  // Audit log
  await supabase.from('document_activity_logs').insert({
    document_type: 'customer',
    document_id: customerId,
    action: 'CUSTOMER_RISK_CHANGED',
    change_summary: `Updated risk flag to [${riskFlag.toUpperCase()}]. Reason: ${riskReason || 'N/A'}`,
    user_id: user?.id || null,
  })

  revalidatePath(`/dashboard/customers/${customerId}`)
  revalidatePath('/dashboard/customers')
  return { success: true }
}
