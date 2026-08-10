'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { UserAgreementFormData, validateUserAgreementData } from '@/lib/agreements/user-agreement-service'

export async function createOrUpdateUserAgreementDraft(formData: UserAgreementFormData) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated.' }

    // Check if an agreement already exists for this booking
    const { data: existing } = await supabase
      .from('rental_agreements')
      .select('id, agreement_number, status')
      .eq('booking_id', formData.booking_id)
      .neq('status', 'cancelled')
      .maybeSingle()

    const payload: any = {
      booking_id: formData.booking_id,
      customer_id: formData.customer_id,
      agreement_date: formData.agreement_date,
      rental_start_at: formData.rental_start_at,
      rental_end_at: formData.rental_end_at,
      template_version: formData.template_version || 'USER_AGREEMENT_V1',
      lessee_snapshot: formData.lessee,
      vehicle_snapshot: formData.vehicle,
      rental_snapshot: formData.rental,
      agreement_variables_snapshot: formData.variables,
      company_snapshot: { name: 'Thennakoon Tours (Pvt) Ltd', reg_no: 'PV-00249821' },
      nominated_drivers_snapshot: formData.nominated_drivers,
      witnesses_snapshot: formData.witnesses,
      lessor_representative_snapshot: formData.lessor_representative,
      pickup_delivery_snapshot: formData.pickup_delivery,
      special_notes: formData.special_notes || null,
      inventory_remarks: formData.inventory_remarks || null,
      terms_snapshot: `Standard User Agreement V1 terms applied for ${formData.agreement_number}`,
      prepared_by: user.id,
      updated_at: new Date().toISOString(),
    }

    let resultRecord: any = null

    if (existing) {
      if (existing.status !== 'draft' && existing.status !== 'generated') {
        return { success: false, error: `Agreement ${existing.agreement_number} is locked in status "${existing.status}" and cannot be edited directly.` }
      }

      const { data: updated, error: uErr } = await supabase
        .from('rental_agreements')
        .update(payload)
        .eq('id', existing.id)
        .select()
        .single()

      if (uErr) return { success: false, error: uErr.message }
      resultRecord = updated
    } else {
      payload.agreement_number = formData.agreement_number
      payload.status = 'draft'

      const { data: inserted, error: iErr } = await supabase
        .from('rental_agreements')
        .insert(payload)
        .select()
        .single()

      if (iErr) return { success: false, error: iErr.message }
      resultRecord = inserted
    }

    await supabase.rpc('log_audit_action_internal', {
      p_action: existing ? 'USER_AGREEMENT_DETAILS_UPDATED' : 'USER_AGREEMENT_DRAFT_CREATED',
      p_entity_type: 'rental_agreement',
      p_entity_id: resultRecord.id,
      p_description: `Saved User Agreement ${resultRecord.agreement_number} draft details.`,
    })

    revalidatePath('/dashboard/agreements')
    revalidatePath(`/dashboard/bookings/${formData.booking_id}`)

    return { success: true, agreement: resultRecord }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to save User Agreement draft.' }
  }
}

export async function generateAndLockUserAgreement(formData: UserAgreementFormData) {
  try {
    const validation = validateUserAgreementData(formData)
    if (!validation.isValid) {
      return {
        success: false,
        error: `Cannot generate agreement: Unresolved required tokens [${validation.missingTokens.join(', ')}]. Please complete all required fields.`,
      }
    }

    const saveRes = await createOrUpdateUserAgreementDraft(formData)
    if (!saveRes.success || !saveRes.agreement) {
      return saveRes
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Lock snapshot & set status to 'generated'
    const { data: locked, error: lErr } = await supabase
      .from('rental_agreements')
      .update({
        status: 'generated',
        updated_at: new Date().toISOString(),
      })
      .eq('id', saveRes.agreement.id)
      .select()
      .single()

    if (lErr) return { success: false, error: lErr.message }

    await supabase.rpc('log_audit_action_internal', {
      p_action: 'USER_AGREEMENT_GENERATED',
      p_entity_type: 'rental_agreement',
      p_entity_id: locked.id,
      p_description: `Generated and locked User Agreement snapshot ${locked.agreement_number}`,
    })

    revalidatePath('/dashboard/agreements')
    revalidatePath(`/dashboard/bookings/${formData.booking_id}`)

    return { success: true, agreement: locked }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to generate User Agreement.' }
  }
}

export async function markUserAgreementSigned(agreementId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated.' }

    const { error } = await supabase
      .from('rental_agreements')
      .update({
        status: 'signed',
        signed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', agreementId)

    if (error) return { success: false, error: error.message }

    await supabase.rpc('log_audit_action_internal', {
      p_action: 'USER_AGREEMENT_SIGNED',
      p_entity_type: 'rental_agreement',
      p_entity_id: agreementId,
      p_description: `Marked User Agreement signed.`,
    })

    revalidatePath('/dashboard/agreements')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}
