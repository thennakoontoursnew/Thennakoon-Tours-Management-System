'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveCompanySettings(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Not authenticated.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'owner') {
    return { success: false, error: 'Unauthorized.' }
  }

  const updates = {
    company_name: formData.get('company_name') as string,
    address: formData.get('address') as string,
    phone_primary: formData.get('phone_primary') as string,
    phone_secondary: formData.get('phone_secondary') as string,
    whatsapp_number: formData.get('whatsapp_number') as string,
    email: formData.get('email') as string,
    website: formData.get('website') as string,
    currency: formData.get('currency') as string,
    timezone: formData.get('timezone') as string,
    quotation_prefix: formData.get('quotation_prefix') as string,
    invoice_prefix: formData.get('invoice_prefix') as string,
    receipt_prefix: formData.get('receipt_prefix') as string,
  }

  const { error } = await supabase
    .from('company_settings')
    .update(updates)
    .eq('id', '00000000-0000-0000-0000-000000000000')

  if (error) return { success: false, error: error.message }

  // Audit log
  await supabase.rpc('log_audit_action_internal', {
    p_action: 'UPDATE_COMPANY_SETTINGS',
    p_entity_type: 'company_settings',
    p_entity_id: null,
    p_description: 'Owner updated company settings',
  })

  revalidatePath('/dashboard/settings')
  return { success: true }
}
