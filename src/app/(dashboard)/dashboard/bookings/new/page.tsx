import { createClient } from '@/lib/supabase/server'
import NewBookingForm from './new-booking-form'
import { convertLeadToCustomerAction } from '../../leads/lead-actions'

interface PageProps {
  searchParams: Promise<{ lead_id?: string; customer_id?: string }>
}

export default async function NewBookingPage({ searchParams }: PageProps) {
  const params = await searchParams
  const supabase = await createClient()

  let initialLead: any = null
  let preselectedCustomerId = params.customer_id || ''

  if (params.lead_id) {
    const { data: l } = await supabase.from('crm_leads').select('*').eq('id', params.lead_id).maybeSingle()
    if (l) {
      initialLead = l
      if (l.customer_id) {
        preselectedCustomerId = l.customer_id
      } else {
        try {
          const res = await convertLeadToCustomerAction(l.id)
          if (res?.customer_id) {
            preselectedCustomerId = res.customer_id
          }
        } catch (_) {}
      }
    }
  }

  const { data: customers } = await supabase
    .from('customers')
    .select('id, customer_code, full_name, mobile, company_name')
    .eq('is_archived', false)
    .order('full_name')

  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('id, vehicle_code, vehicle_name, registration_number, daily_rate, refundable_deposit, status, holding_type, owner_contact_name, owner_contact_phone, agreed_payout_rate')
    .eq('is_archived', false)
    .order('vehicle_name')

  return (
    <div className="max-w-5xl mx-auto">
      <NewBookingForm
        customers={customers || []}
        vehicles={vehicles || []}
        initialCustomerId={preselectedCustomerId}
        initialLead={initialLead}
      />
    </div>
  )
}
