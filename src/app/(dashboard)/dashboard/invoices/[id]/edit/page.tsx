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

  // Fetch Vehicles
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('id, vehicle_name, registration_number, category, make, model')
    .eq('is_archived', false)
    .order('vehicle_name', { ascending: true })

  // Fetch Recent Quotations
  const { data: quotations } = await supabase
    .from('quotations')
    .select('id, quotation_number, customer_id, items:quotation_items(*)')
    .neq('status', 'cancelled')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <CreateInvoiceForm
      customers={customers || []}
      bookings={bookings || []}
      vehicles={vehicles || []}
      quotations={quotations || []}
      defaultInvoiceNumber={existingInvoice.invoice_number}
      currentUser={currentUserProfile}
      initialInvoice={existingInvoice}
    />
  )
}
