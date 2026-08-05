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
      // Gracefully handle concurrent request unique constraint violation
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
