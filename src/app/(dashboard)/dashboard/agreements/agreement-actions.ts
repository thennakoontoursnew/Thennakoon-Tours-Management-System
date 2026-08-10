'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createAgreementFromBooking(bookingId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated.' }

    // 1. Verify booking exists
    const { data: b, error: bErr } = await supabase
      .from('bookings')
      .select('*, customer:customers(*)')
      .eq('id', bookingId)
      .single()

    if (bErr || !b) return { success: false, error: 'Booking not found.' }

    // 2. Search for existing ACTIVE agreement for the booking
    const { data: existingAgr } = await supabase
      .from('rental_agreements')
      .select('id, agreement_number, status')
      .eq('booking_id', bookingId)
      .neq('status', 'cancelled')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (existingAgr) {
      return {
        success: true,
        existing: true,
        agreementId: existingAgr.id,
        agreementNumber: existingAgr.agreement_number,
      }
    }

    // 3. Verify at least one vehicle allocation row exists
    const { data: bvs } = await supabase
      .from('booking_vehicles')
      .select('id')
      .eq('booking_id', bookingId)

    if (!bvs || bvs.length === 0) {
      return { success: false, error: 'Cannot generate agreement: No vehicles allocated to this booking.' }
    }

    // 4. Fetch document template terms or company settings terms
    const { data: template } = await supabase
      .from('document_templates')
      .select('default_terms_and_conditions')
      .eq('document_type', 'rental_agreement')
      .eq('is_active', true)
      .maybeSingle()

    const { data: companySettings } = await supabase
      .from('company_settings')
      .select('default_agreement_terms')
      .limit(1)
      .maybeSingle()

    const terms =
      template?.default_terms_and_conditions ||
      companySettings?.default_agreement_terms ||
      '1. Hirer is responsible for vehicle during rental period. 2. Fuel level must match pickup level. 3. Vehicle must be returned on time.'

    // 5. Generate agreement record with race-condition safety
    const { data: agr, error: aErr } = await supabase
      .from('rental_agreements')
      .insert({
        booking_id: b.id,
        customer_id: b.customer_id,
        agreement_date: new Date().toISOString().split('T')[0],
        rental_start_at: b.rental_start_at,
        rental_end_at: b.rental_end_at,
        terms_snapshot: terms,
        status: 'generated',
        prepared_by: user.id,
      })
      .select()
      .single()

    if (aErr) {
      if (aErr.code === '23505' || aErr.message.includes('unique_active_agreement_per_booking')) {
        const { data: reQueried } = await supabase
          .from('rental_agreements')
          .select('id, agreement_number')
          .eq('booking_id', bookingId)
          .neq('status', 'cancelled')
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle()

        if (reQueried) {
          return {
            success: true,
            existing: true,
            agreementId: reQueried.id,
            agreementNumber: reQueried.agreement_number,
          }
        }
      }
      return { success: false, error: aErr.message || 'Failed to create agreement.' }
    }

    if (!agr) return { success: false, error: 'Failed to create agreement record.' }

    // 6. Write document activity log
    await supabase.from('document_activity_logs').insert({
      document_type: 'booking',
      document_id: bookingId,
      action: 'GENERATE_RENTAL_AGREEMENT',
      change_summary: `Generated rental agreement ${agr.agreement_number}`,
      metadata: { agreement_id: agr.id, agreement_number: agr.agreement_number },
      user_id: user.id,
    })

    // 7. Write system audit log
    await supabase.rpc('log_audit_action_internal', {
      p_action: 'CREATE_RENTAL_AGREEMENT',
      p_entity_type: 'rental_agreement',
      p_entity_id: agr.id,
      p_description: `Generated rental agreement ${agr.agreement_number} from booking ${b.booking_number}`,
    })

    revalidatePath('/dashboard/agreements')
    revalidatePath(`/dashboard/bookings/${bookingId}`)
    return { success: true, agreementId: agr.id, agreementNumber: agr.agreement_number }
  } catch (err: any) {
    return { success: false, error: err.message || 'Agreement generation failed.' }
  }
}

// =============================================
// CREATE OWNER AGREEMENT (OAG-YYYY-XXXXXX)
// =============================================
export async function createOwnerAgreementAction(data: {
  vehicle_owner_id: string
  vehicle_ids: string[]
  agreement_start_date: string
  agreement_end_date?: string
  settlement_rule: string
  revenue_share_pct?: number
  flat_rate_per_day?: number
  fixed_monthly_amount?: number
  per_booking_amount?: number
  security_deposit?: number
  advance_amount?: number
  maintenance_responsibility?: string
  insurance_responsibility?: string
  repair_responsibility?: string
  termination_notice_days?: number
  terms_and_conditions?: string
  special_conditions?: string
}) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated.' }

    // Generate atomic Owner Agreement Number
    let oagNumber = `OAG-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`
    try {
      const { data: generated } = await supabase.rpc('generate_next_owner_agreement_number')
      if (generated) oagNumber = generated
    } catch (_) {}

    // Insert Owner Agreement
    const { data: agreement, error: aErr } = await supabase
      .from('owner_agreements')
      .insert({
        agreement_number: oagNumber,
        vehicle_owner_id: data.vehicle_owner_id,
        agreement_start_date: data.agreement_start_date,
        agreement_end_date: data.agreement_end_date || null,
        settlement_rule: data.settlement_rule,
        revenue_share_pct: data.revenue_share_pct || null,
        flat_rate_per_day: data.flat_rate_per_day || null,
        fixed_monthly_amount: data.fixed_monthly_amount || null,
        per_booking_amount: data.per_booking_amount || null,
        security_deposit: data.security_deposit || 0,
        advance_amount: data.advance_amount || 0,
        maintenance_responsibility: data.maintenance_responsibility || 'owner',
        insurance_responsibility: data.insurance_responsibility || 'owner',
        repair_responsibility: data.repair_responsibility || 'owner',
        termination_notice_days: data.termination_notice_days || 30,
        terms_and_conditions: data.terms_and_conditions || null,
        special_conditions: data.special_conditions || null,
        status: 'active',
        activated_at: new Date().toISOString(),
        created_by: user.id,
      })
      .select()
      .single()

    if (aErr || !agreement) {
      return { success: false, error: aErr?.message || 'Failed to create Owner Agreement.' }
    }

    // Insert covered vehicles in junction table
    if (data.vehicle_ids && data.vehicle_ids.length > 0) {
      const vehicleRows = data.vehicle_ids.map((vid) => ({
        owner_agreement_id: agreement.id,
        vehicle_id: vid,
        revenue_share_pct: data.revenue_share_pct || null,
        flat_rate_per_day: data.flat_rate_per_day || null,
      }))

      await supabase.from('owner_agreement_vehicles').insert(vehicleRows)
    }

    // Write audit log
    await supabase.rpc('log_audit_action_internal', {
      p_action: 'OWNER_AGREEMENT_CREATED',
      p_entity_type: 'owner_agreement',
      p_entity_id: agreement.id,
      p_description: `Created Owner Agreement ${agreement.agreement_number}`,
    })

    revalidatePath('/dashboard/agreements')
    revalidatePath(`/dashboard/fleet/owners/${data.vehicle_owner_id}`)
    return { success: true, agreement }
  } catch (err: any) {
    return { success: false, error: err.message || 'Owner Agreement creation failed.' }
  }
}

// =============================================
// UPDATE OWNER AGREEMENT STATUS
// =============================================
export async function updateOwnerAgreementStatusAction(id: string, status: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated.' }

    const updatePayload: any = { status, updated_at: new Date().toISOString() }

    if (status === 'active') updatePayload.activated_at = new Date().toISOString()
    if (status === 'completed') updatePayload.completed_at = new Date().toISOString()
    if (status === 'cancelled') updatePayload.cancelled_at = new Date().toISOString()
    if (status === 'archived') updatePayload.is_archived = true

    const { error } = await supabase
      .from('owner_agreements')
      .update(updatePayload)
      .eq('id', id)

    if (error) return { success: false, error: error.message }

    const actionText = `OWNER_AGREEMENT_${status.toUpperCase()}`
    await supabase.rpc('log_audit_action_internal', {
      p_action: actionText,
      p_entity_type: 'owner_agreement',
      p_entity_id: id,
      p_description: `Updated Owner Agreement status to ${status}`,
    })

    revalidatePath('/dashboard/agreements')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Status update failed.' }
  }
}
