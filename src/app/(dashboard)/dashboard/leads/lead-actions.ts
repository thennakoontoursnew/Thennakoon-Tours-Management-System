'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createLeadAction(leadData: any) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Insert lead
  const { data: newLead, error } = await supabase
    .from('crm_leads')
    .insert({
      ...leadData,
      created_by: user?.id || null,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create lead record: ${error.message}`)
  }

  // Audit log
  await supabase.from('document_activity_logs').insert({
    document_type: 'lead',
    document_id: newLead.id,
    action: 'LEAD_CREATED',
    change_summary: `Created lead ${newLead.lead_number} for prospect ${newLead.prospect_name} (${newLead.source})`,
    user_id: user?.id || null,
  })

  revalidatePath('/dashboard/leads')
  return { success: true, lead: newLead }
}

export async function updateLeadStatusAction(leadId: string, status: string, lostReason?: string, lostNotes?: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const updatePayload: any = {
    status,
    updated_at: new Date().toISOString(),
  }

  if (status === 'lost') {
    updatePayload.lost_reason = lostReason || 'No response'
    updatePayload.lost_notes = lostNotes || null
    updatePayload.lost_at = new Date().toISOString()
    updatePayload.lost_by = user?.id || null
  }

  const { error } = await supabase.from('crm_leads').update(updatePayload).eq('id', leadId)

  if (error) {
    throw new Error(`Failed to update lead status: ${error.message}`)
  }

  // Audit log
  await supabase.from('document_activity_logs').insert({
    document_type: 'lead',
    document_id: leadId,
    action: 'LEAD_STATUS_CHANGED',
    change_summary: `Updated lead status to [${status.toUpperCase()}]. ${status === 'lost' ? `Reason: ${lostReason}` : ''}`,
    user_id: user?.id || null,
  })

  revalidatePath('/dashboard/leads')
  return { success: true }
}

export async function convertLeadToCustomerAction(leadId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch Lead record
  const { data: lead, error: fetchErr } = await supabase.from('crm_leads').select('*').eq('id', leadId).single()
  if (fetchErr || !lead) {
    throw new Error('Lead record not found.')
  }

  if (lead.customer_id) {
    return { success: true, customer_id: lead.customer_id }
  }

  // Insert Customer record
  const { data: newCustomer, error: custErr } = await supabase
    .from('customers')
    .insert({
      full_name: lead.prospect_name,
      mobile: lead.mobile,
      whatsapp: lead.whatsapp || lead.mobile,
      email: lead.email || null,
      source: lead.source,
      notes: lead.notes || null,
      status: 'active',
      created_by: user?.id || null,
    })
    .select()
    .single()

  if (custErr) {
    throw new Error(`Failed to create customer from lead: ${custErr.message}`)
  }

  // Link customer_id to lead and mark lead status as qualified
  await supabase
    .from('crm_leads')
    .update({
      customer_id: newCustomer.id,
      status: 'qualified',
    })
    .eq('id', leadId)

  // Audit log
  await supabase.from('document_activity_logs').insert({
    document_type: 'lead',
    document_id: leadId,
    action: 'LEAD_CONVERTED_TO_CUSTOMER',
    change_summary: `Converted lead ${lead.lead_number} into customer ${newCustomer.customer_code}`,
    user_id: user?.id || null,
  })

  revalidatePath('/dashboard/leads')
  revalidatePath('/dashboard/customers')
  return { success: true, customer_id: newCustomer.id }
}
