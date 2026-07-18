'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createAgreementFromBooking(bookingId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated.' }

    const { data: b, error: bErr } = await supabase
      .from('bookings')
      .select('*, customer:customers(*)')
      .eq('id', bookingId)
      .single()

    if (bErr || !b) return { success: false, error: 'Booking not found.' }

    const { data: companySettings } = await supabase
      .from('company_settings')
      .select('default_agreement_terms')
      .limit(1)
      .single()

    const terms = companySettings?.default_agreement_terms || '1. Hirer is responsible for vehicle during rental period. 2. Fuel level must match pickup level.'

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

    if (aErr || !agr) return { success: false, error: aErr?.message || 'Failed to create agreement.' }

    await supabase.rpc('log_audit_action_internal', {
      p_action: 'CREATE_RENTAL_AGREEMENT',
      p_entity_type: 'rental_agreement',
      p_entity_id: agr.id,
      p_description: `Generated rental agreement ${agr.agreement_number}`,
    })

    revalidatePath('/dashboard/agreements')
    revalidatePath(`/dashboard/bookings/${bookingId}`)
    return { success: true, agreementId: agr.id }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}
