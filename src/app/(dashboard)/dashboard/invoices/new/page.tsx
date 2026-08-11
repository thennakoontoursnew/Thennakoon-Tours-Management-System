import { createClient } from '@/lib/supabase/server'
import { CreateInvoiceForm } from './create-invoice-form'

export default async function NewInvoicePage() {
  const supabase = await createClient()

  // Fetch Customers
  const { data: customers } = await supabase
    .from('customers')
    .select('id, full_name, company_name, mobile, email, address_line_1')
    .eq('is_archived', false)
    .order('full_name', { ascending: true })

  // Fetch Active Bookings
  const { data: bookings } = await supabase
    .from('bookings')
    .select('*, booking_vehicles(*, vehicle:vehicles(vehicle_name, registration_number))')
    .order('created_at', { ascending: false })
    .limit(50)

  // Generate Next Invoice Number
  let defaultInvoiceNo = 'TT-IN-10001'
  try {
    const { data: counterData } = await supabase.rpc('generate_next_invoice_number')
    if (counterData) {
      defaultInvoiceNo = counterData
    }
  } catch (err) {
    console.warn('Fallback invoice numbering:', err)
  }

  return (
    <CreateInvoiceForm
      customers={customers || []}
      bookings={bookings || []}
      defaultInvoiceNumber={defaultInvoiceNo}
    />
  )
}
