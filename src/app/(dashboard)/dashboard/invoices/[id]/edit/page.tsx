import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { CreateInvoiceForm } from '../../new/create-invoice-form'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditInvoicePage({ params }: PageProps) {
  const { id } = await params
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

  const allowedRoles = ['owner', 'admin', 'manager', 'finance_staff', 'booking_staff']
  if (!allowedRoles.includes(currentUserProfile.role)) {
    redirect('/unauthorized')
  }

  // Fetch Existing Invoice with Customer, Items, and Deductions
  const { data: existingInvoice } = await supabase
    .from('invoices')
    .select('*, customer:customers(*), items:invoice_items(*), deductions:invoice_deductions(*)')
    .eq('id', id)
    .single()

  if (!existingInvoice) {
    notFound()
  }

  // Fetch Customers (All active CRM customers)
  let customers: any[] = []
  try {
    const { data: rawCustomers, error: custErr } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })

    if (custErr) {
      console.error('[DEBUG CUSTOMERS FETCH EDIT ERROR]:', custErr)
    } else if (rawCustomers) {
      customers = rawCustomers.filter((c: any) => !c.is_archived)
    }
  } catch (err) {
    console.error('[DEBUG CUSTOMERS FETCH EDIT CATCH]:', err)
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log(`[DEBUG CUSTOMERS FETCH EDIT]: ${customers?.length || 0} active customers loaded`)
  }

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
      console.error('[DEBUG VEHICLES FETCH EDIT ERROR]:', vehicleErr)
    } else if (rawVehicles) {
      vehicles = rawVehicles.filter((v: any) => !v.is_archived)
    }
  } catch (err) {
    console.error('[DEBUG VEHICLES FETCH EDIT CATCH]:', err)
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log(`[DEBUG VEHICLES FETCH EDIT]: ${vehicles?.length || 0} active fleet vehicles loaded`)
  }

  // Fetch Recent Quotations
  const { data: quotations } = await supabase
    .from('quotations')
    .select('id, quotation_number, customer_id, items:quotation_items(*)')
    .neq('status', 'cancelled')
    .order('created_at', { ascending: false })
    .limit(50)

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
      defaultInvoiceNumber={existingInvoice.invoice_number}
      currentUser={currentUserProfile}
      initialInvoice={existingInvoice}
      companySettings={companySettings || undefined}
    />
  )
}
