'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { documentTemplateSchema } from '@/lib/validations/templates'
import { normalizeNewlines } from '@/lib/utils/formatters'
import { z } from 'zod'

type TemplateInput = z.infer<typeof documentTemplateSchema>

const DEFAULT_QUOTATION_TEMPLATE = {
  document_type: 'quotation',
  display_name: 'Standard Quotation Template',
  special_notes: `• 700km allowed.
• This quotation is valid for 24 hours only.
• Vehicles are subject to availability.
• If a booking is cancelled after making the advance payment, the advance payment is non-refundable.
• Above rates exclude tax charges.
• To reserve a vehicle, a minimum advance payment is required.`,
  important_message: `Please find the account details below. Kindly ensure the payment is made on or before the due date to the mentioned account. Once the payment is completed, please WhatsApp the payment slip to the company contact number and mention the vehicle registration number as the reference.`,
  bank_account_name: 'Thennakoon Tours (Pvt) Ltd',
  bank_name: 'Nations Trust Bank',
  bank_branch: 'Nugegoda',
  bank_account_number: '100530013140',
  bank_swift_code: 'NTBCLKLX',
  payment_instructions: 'Kindly ensure payment is completed on or before the due date. Please mention vehicle registration number as reference.',
  prepared_by_designation: 'Admin & Marketing Assistant',
  company_name: 'Thennakoon Tours (Pvt) Ltd',
  default_terms_and_conditions: 'Standard Thennakoon Tours quotation terms and conditions apply.',
  is_active: true,
}

const DEFAULT_INVOICE_TEMPLATE = {
  document_type: 'invoice',
  display_name: 'Standard Invoice Template',
  special_notes: `• Payment due within 7 days of invoice date.
• Late payments subject to a 2% monthly surcharge.`,
  important_message: `Please send payment receipt confirmation to info@thennakoontours.com once transferred.`,
  bank_account_name: 'Thennakoon Tours (Pvt) Ltd',
  bank_name: 'Nations Trust Bank',
  bank_branch: 'Nugegoda',
  bank_account_number: '100530013140',
  bank_swift_code: 'NTBCLKLX',
  payment_instructions: 'Please send bank transfer receipt with invoice number as reference.',
  prepared_by_designation: 'Accounts Manager',
  company_name: 'Thennakoon Tours (Pvt) Ltd',
  default_terms_and_conditions: 'Standard Thennakoon Tours billing terms apply.',
  is_active: true,
}

const DEFAULT_RECEIPT_TEMPLATE = {
  document_type: 'receipt',
  display_name: 'Standard Receipt Template',
  special_notes: 'Official Proof of Payment. Retain this receipt for your records.',
  important_message: 'Payment received with thanks. We appreciate your business!',
  bank_account_name: 'Thennakoon Tours (Pvt) Ltd',
  bank_name: 'Nations Trust Bank',
  bank_branch: 'Nugegoda',
  bank_account_number: '100530013140',
  bank_swift_code: 'NTBCLKLX',
  payment_instructions: 'Payment completed successfully.',
  prepared_by_designation: 'Finance Cashier',
  company_name: 'Thennakoon Tours (Pvt) Ltd',
  default_terms_and_conditions: 'This is a computer-generated receipt.',
  is_active: true,
}

const DEFAULT_AGREEMENT_TEMPLATE = {
  document_type: 'rental_agreement',
  display_name: 'Standard Rental Agreement Template',
  special_notes: `• Hirer is fully responsible for vehicle condition during the rental period.
• Any traffic fines or toll charges incurred will be charged to the hirer.`,
  important_message: 'Please inspect vehicle condition with our representative before departure.',
  bank_account_name: 'Thennakoon Tours (Pvt) Ltd',
  bank_name: 'Nations Trust Bank',
  bank_branch: 'Nugegoda',
  bank_account_number: '100530013140',
  bank_swift_code: 'NTBCLKLX',
  payment_instructions: 'Security deposit required prior to vehicle handover.',
  prepared_by_designation: 'Fleet Manager',
  company_name: 'Thennakoon Tours (Pvt) Ltd',
  default_terms_and_conditions: 'Standard Thennakoon Tours vehicle rental agreement terms apply.',
  is_active: true,
}

async function verifyTemplateWritePermission(supabase: any, userId: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', userId)
    .single()

  if (!profile || !profile.is_active) return false
  const allowed = ['owner', 'admin', 'manager']
  return allowed.includes(profile.role)
}

function cleanTemplateRecord(raw: any) {
  if (!raw) return null
  return {
    ...raw,
    special_notes: normalizeNewlines(raw.special_notes),
    important_message: normalizeNewlines(raw.important_message),
    payment_instructions: normalizeNewlines(raw.payment_instructions),
    default_terms_and_conditions: normalizeNewlines(raw.default_terms_and_conditions),
  }
}

export async function getDocumentTemplates() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('document_templates')
      .select('*')
      .order('document_type')

    if (error) return { success: false, error: error.message, templates: [] }
    return { success: true, templates: (data || []).map(cleanTemplateRecord) }
  } catch (err: any) {
    return { success: false, error: err.message, templates: [] }
  }
}

export async function getDocumentTemplateByType(type: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('document_templates')
      .select('*')
      .eq('document_type', type)
      .maybeSingle()

    if (data) return { success: true, template: cleanTemplateRecord(data) }

    // Fallback: Return safe system default template without crashing
    let defaultObj: any = DEFAULT_QUOTATION_TEMPLATE
    if (type === 'invoice') defaultObj = DEFAULT_INVOICE_TEMPLATE
    if (type === 'receipt') defaultObj = DEFAULT_RECEIPT_TEMPLATE
    if (type === 'rental_agreement') defaultObj = DEFAULT_AGREEMENT_TEMPLATE

    return { success: true, template: cleanTemplateRecord({ id: 'default', ...defaultObj }) }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function updateDocumentTemplate(type: string, values: Partial<TemplateInput>) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated.' }

    const hasPermission = await verifyTemplateWritePermission(supabase, user.id)
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Only owner, admin, or manager roles can edit document templates.' }
    }

    const payload = {
      document_type: type,
      display_name: values.display_name?.trim() || `${type.toUpperCase()} Template`,
      special_notes: normalizeNewlines(values.special_notes),
      important_message: normalizeNewlines(values.important_message),
      bank_account_name: values.bank_account_name?.trim() || null,
      bank_name: values.bank_name?.trim() || null,
      bank_branch: values.bank_branch?.trim() || null,
      bank_account_number: values.bank_account_number?.trim() || null,
      bank_swift_code: values.bank_swift_code?.trim() || null,
      payment_instructions: normalizeNewlines(values.payment_instructions),
      prepared_by_designation: values.prepared_by_designation?.trim() || null,
      company_name: values.company_name?.trim() || null,
      default_terms_and_conditions: normalizeNewlines(values.default_terms_and_conditions),
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase
      .from('document_templates')
      .upsert(payload, { onConflict: 'document_type' })

    if (error) return { success: false, error: error.message }

    await supabase.rpc('log_audit_action_internal', {
      p_action: 'UPDATE_DOCUMENT_TEMPLATE',
      p_entity_type: 'document_template',
      p_entity_id: type,
      p_description: `Updated document template for ${type}`,
    })

    revalidatePath('/dashboard/document-templates')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update template.' }
  }
}

export async function resetDocumentTemplateToDefault(type: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated.' }

    const hasPermission = await verifyTemplateWritePermission(supabase, user.id)
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Only owner, admin, or manager roles can edit document templates.' }
    }

    let defaultObj: any = DEFAULT_QUOTATION_TEMPLATE
    if (type === 'invoice') defaultObj = DEFAULT_INVOICE_TEMPLATE
    if (type === 'receipt') defaultObj = DEFAULT_RECEIPT_TEMPLATE
    if (type === 'rental_agreement') defaultObj = DEFAULT_AGREEMENT_TEMPLATE

    const { error } = await supabase
      .from('document_templates')
      .upsert({ ...defaultObj, updated_by: user.id, updated_at: new Date().toISOString() }, { onConflict: 'document_type' })

    if (error) return { success: false, error: error.message }

    revalidatePath('/dashboard/document-templates')
    return { success: true, template: cleanTemplateRecord(defaultObj) }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to reset template.' }
  }
}
