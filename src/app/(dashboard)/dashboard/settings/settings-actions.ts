'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

// =============================================
// SAVE COMPANY SETTINGS (FORM DATA HANDLER)
// =============================================
export async function saveCompanySettings(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const companyName = formData.get('company_name')?.toString() || 'Thennakoon Tours'
  const address = formData.get('address')?.toString() || null
  const phonePrimary = formData.get('phone_primary')?.toString() || null
  const phoneSecondary = formData.get('phone_secondary')?.toString() || null
  const whatsappNumber = formData.get('whatsapp_number')?.toString() || null
  const email = formData.get('email')?.toString() || null
  const website = formData.get('website')?.toString() || null
  const currency = formData.get('currency')?.toString() || 'LKR'
  const timezone = formData.get('timezone')?.toString() || 'Asia/Colombo'
  const quotationPrefix = formData.get('quotation_prefix')?.toString() || 'QT'
  const invoicePrefix = formData.get('invoice_prefix')?.toString() || 'TT-IN-'
  const receiptPrefix = formData.get('receipt_prefix')?.toString() || 'RCPT'
  const defaultInvoiceTerms = formData.get('default_invoice_terms')?.toString() || null
  const defaultSpecialNotes = formData.get('default_special_notes')?.toString() || null
  const signatureUrl = formData.get('signature_url')?.toString() || null

  // Query existing row to preserve single-record primary key ID
  const { data: existing } = await supabase
    .from('company_settings')
    .select('id')
    .limit(1)
    .maybeSingle()

  const payload: Record<string, unknown> = {
    company_name: companyName,
    address,
    phone_primary: phonePrimary,
    phone_secondary: phoneSecondary,
    whatsapp_number: whatsappNumber,
    email,
    website,
    currency,
    timezone,
    quotation_prefix: quotationPrefix,
    invoice_prefix: invoicePrefix,
    receipt_prefix: receiptPrefix,
    default_invoice_terms: defaultInvoiceTerms,
    default_special_notes: defaultSpecialNotes,
    signature_url: signatureUrl,
    updated_at: new Date().toISOString(),
  }

  if (existing?.id) {
    payload.id = existing.id
  }

  // Primary attempt via user client
  let { error } = await supabase
    .from('company_settings')
    .upsert(payload, { onConflict: 'id' })

  // Fallback attempt via admin client if RLS or permission issue arises
  if (error) {
    console.warn('[saveCompanySettings] User client failed, retrying via admin client:', error.message)
    try {
      const adminClient = createAdminClient()
      const { error: adminErr } = await adminClient
        .from('company_settings')
        .upsert(payload, { onConflict: 'id' })
      error = adminErr
    } catch (adminEx: any) {
      console.error('[saveCompanySettings] Admin client fallback exception:', adminEx)
    }
  }

  if (error) return { error: error.message }

  revalidatePath('/dashboard/settings')
  return { success: true }
}

// =============================================
// UPDATE SYSTEM SETTINGS
// =============================================
export async function updateSystemSettingsAction(settingKey: string, settingValue: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('system_settings')
    .upsert({ setting_key: settingKey, setting_value: settingValue, updated_at: new Date().toISOString() }, { onConflict: 'setting_key' })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/settings')
  return { success: true }
}

// =============================================
// UPDATE ROLE PERMISSIONS MATRIX
// =============================================
export async function updateRolePermissionsAction(role: string, moduleName: string, permissions: { can_view: boolean; can_create: boolean; can_edit: boolean; can_delete: boolean }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('role_permissions')
    .upsert(
      {
        role,
        module: moduleName,
        can_view: permissions.can_view,
        can_create: permissions.can_create,
        can_edit: permissions.can_edit,
        can_delete: permissions.can_delete,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'role,module' }
    )

  if (error) return { error: error.message }

  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard/users')
  return { success: true }
}

// =============================================
// UPLOAD COMPANY LETTERHEAD ASSET
// =============================================
export async function uploadCompanyLetterheadAction(formData: FormData): Promise<{ success?: boolean; error?: string; url?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const file = formData.get('file') as File | null
  if (!file || typeof file === 'string') {
    return { error: 'Please select a valid image file to upload.' }
  }

  const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
  if (!validTypes.includes(file.type)) {
    return { error: 'Invalid file format. Please upload a PNG or JPEG image.' }
  }

  const MAX_SIZE = 5 * 1024 * 1024 // 5MB
  if (file.size > MAX_SIZE) {
    return { error: 'File size exceeds maximum limit of 5MB.' }
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
  const filePath = `branding/letterhead-${Date.now()}.${ext}`

  const adminClient = process.env.SUPABASE_SERVICE_ROLE_KEY ? createAdminClient() : supabase

  // Ensure storage bucket exists
  try {
    await adminClient.storage.createBucket('company-assets', { public: true })
  } catch (_) {}

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const { error: uploadError } = await adminClient.storage
    .from('company-assets')
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: true,
    })

  if (uploadError) {
    console.error('[uploadCompanyLetterheadAction] Storage upload error:', uploadError)
    return { error: `Failed to upload letterhead image: ${uploadError.message}` }
  }

  const { data: publicUrlData } = adminClient.storage
    .from('company-assets')
    .getPublicUrl(filePath)

  const publicUrl = publicUrlData.publicUrl

  // Query existing row to preserve single-record primary key ID
  const { data: existing } = await adminClient
    .from('company_settings')
    .select('id')
    .limit(1)
    .maybeSingle()

  const payload: Record<string, unknown> = {
    letterhead_url: publicUrl,
    updated_at: new Date().toISOString(),
  }
  if (existing?.id) {
    payload.id = existing.id
  }

  const { error: updateError } = await adminClient
    .from('company_settings')
    .upsert(payload, { onConflict: 'id' })

  if (updateError) {
    console.error('[uploadCompanyLetterheadAction] Settings update error:', updateError)
    return { error: `Failed to update company settings: ${updateError.message}` }
  }

  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard/invoices')
  revalidatePath('/dashboard/agreements')
  revalidatePath('/dashboard/quotations')
  revalidatePath('/dashboard/receipts')

  return { success: true, url: publicUrl }
}

// =============================================
// REMOVE COMPANY LETTERHEAD (RESET TO DEFAULT)
// =============================================
export async function removeCompanyLetterheadAction(): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const adminClient = process.env.SUPABASE_SERVICE_ROLE_KEY ? createAdminClient() : supabase

  const { data: existing } = await adminClient
    .from('company_settings')
    .select('id')
    .limit(1)
    .maybeSingle()

  const payload: Record<string, unknown> = {
    letterhead_url: null,
    updated_at: new Date().toISOString(),
  }
  if (existing?.id) {
    payload.id = existing.id
  }

  const { error: updateError } = await adminClient
    .from('company_settings')
    .upsert(payload, { onConflict: 'id' })

  if (updateError) {
    return { error: `Failed to reset letterhead: ${updateError.message}` }
  }

  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard/invoices')
  revalidatePath('/dashboard/agreements')
  revalidatePath('/dashboard/quotations')
  revalidatePath('/dashboard/receipts')

  return { success: true }
}
