import { createClient } from '@/lib/supabase/server'
import { CreateInvoiceForm } from './create-invoice-form'

export default async function NewInvoicePage() {
  const supabase = await createClient()

  // Get current user profile
  const { data: { user } } = await supabase.auth.getUser()
  let currentUserProfile = {
    id: user?.id || '',
    full_name: 'Staff Member',
    role: 'finance_staff',
  }

  if (user?.id) {
    const { data: prof } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('id', user.id)
      .maybeSingle()

    if (prof) {
      currentUserProfile = {
        id: prof.id,
        full_name: prof.full_name || 'Staff Member',
        role: prof.role || 'finance_staff',
      }
    }
  }

  // Fetch Customers
  const { data: customers } = await supabase
    .from('customers')
    .select('id, full_name, company_name, mobile, email, address_line_1, identifier_no')
    .eq('is_archived', false)
    .order('full_name', { ascending: true })

  // Fetch Active Bookings
  const { data: bookings } = await supabase
    .from('bookings')
    .select('*, booking_vehicles(*, vehicle:vehicles(vehicle_name, registration_number))')
    .order('created_at', { ascending: false })
    .limit(50)

  // Fetch Vehicles (All active registered fleet vehicles)
  let vehicles: any[] = []
  try {
    const { data: rawVehicles, error: vehicleErr } = await supabase
      .from('vehicles')
      .select('*')
      .order('created_at', { ascending: false })

    if (vehicleErr) {
      console.error('[DEBUG VEHICLES FETCH ERROR]:', vehicleErr)
    } else if (rawVehicles) {
      vehicles = rawVehicles.filter((v: any) => !v.is_archived)
    }
  } catch (err) {
    console.error('[DEBUG VEHICLES FETCH CATCH]:', err)
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log(`[DEBUG VEHICLES FETCH]: ${vehicles?.length || 0} active fleet vehicles loaded`)
  }

  // Fetch Recent Quotations
  const { data: quotations } = await supabase
    .from('quotations')
    .select('id, quotation_number, customer_id, items:quotation_items(*)')
    .neq('status', 'cancelled')
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

  // Fetch Company Settings
  const { data: companySettings } = await supabase
    .from('company_settings')
    .select('*')
    .limit(1)
    .maybeSingle()

  return (
    <CreateInvoiceForm
      customers={customers || []}
      bookings={bookings || []}
      vehicles={vehicles || []}
      quotations={quotations || []}
      defaultInvoiceNumber={defaultInvoiceNo}
      currentUser={currentUserProfile}
      companySettings={companySettings || undefined}
    />
  )
}
