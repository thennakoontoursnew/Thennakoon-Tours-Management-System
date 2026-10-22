import { createClient } from '@/lib/supabase/server'
import NewQuotationForm from './new-quotation-form'
import { getDocumentTemplateByType } from '../../document-templates/template-actions'
import { convertLeadToCustomerAction } from '../../leads/lead-actions'

interface PageProps {
  searchParams: Promise<{ lead_id?: string; customer_id?: string }>
}

export default async function NewQuotationPage({ searchParams }: PageProps) {
  const params = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: userProfile } = user
    ? await supabase.from('profiles').select('full_name').eq('id', user.id).single()
    : { data: null }

  let initialLead: any = null
  let preselectedCustomerId = params.customer_id || ''

  if (params.lead_id) {
    const { data: l } = await supabase.from('crm_leads').select('*').eq('id', params.lead_id).maybeSingle()
    if (l) {
      initialLead = l
      if (l.customer_id) {
        preselectedCustomerId = l.customer_id
      } else {
        // Auto convert lead to customer if not already linked so customer is immediately created
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
    .select('id, vehicle_code, vehicle_name, registration_number, daily_rate, refundable_deposit, allowed_km_per_day, extra_km_charge, manufacture_year')
    .eq('is_archived', false)
    .order('vehicle_name')

  const res = await getDocumentTemplateByType('quotation')
  const template = res.template

  return (
    <div className="max-w-5xl mx-auto">
      <NewQuotationForm
        customers={customers || []}
        vehicles={vehicles || []}
        template={template}
        userProfile={userProfile}
        initialCustomerId={preselectedCustomerId}
        initialLead={initialLead}
      />
    </div>
  )
}
