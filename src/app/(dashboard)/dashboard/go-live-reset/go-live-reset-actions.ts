'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getGoLiveResetSummary() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated.' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role, full_name')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'owner') {
      return { success: false, error: 'Permission denied. Only the System Owner may access Go Live Reset.' }
    }

    // Fetch Table Row Counts safely
    const [
      { count: cntCustomers },
      { count: cntVehicles },
      { count: cntDrivers },
      { count: cntQuotations },
      { count: cntQuotationItems },
      { count: cntBookings },
      { count: cntBookingVehicles },
      { count: cntInvoices },
      { count: cntInvoiceItems },
      { count: cntPayments },
      { count: cntReceipts },
      { count: cntAgreements },
      { count: cntDocumentLogs },
    ] = await Promise.all([
      supabase.from('customers').select('*', { count: 'exact', head: true }),
      supabase.from('vehicles').select('*', { count: 'exact', head: true }),
      supabase.from('drivers').select('*', { count: 'exact', head: true }),
      supabase.from('quotations').select('*', { count: 'exact', head: true }),
      supabase.from('quotation_items').select('*', { count: 'exact', head: true }),
      supabase.from('bookings').select('*', { count: 'exact', head: true }),
      supabase.from('booking_vehicles').select('*', { count: 'exact', head: true }),
      supabase.from('invoices').select('*', { count: 'exact', head: true }),
      supabase.from('invoice_items').select('*', { count: 'exact', head: true }),
      supabase.from('payments').select('*', { count: 'exact', head: true }),
      supabase.from('receipts').select('*', { count: 'exact', head: true }),
      supabase.from('rental_agreements').select('*', { count: 'exact', head: true }),
      supabase.from('document_activity_logs').select('*', { count: 'exact', head: true }),
    ])

    // Fetch Company Settings Go Live Status
    const { data: settings } = await supabase
      .from('company_settings')
      .select('go_live_completed, go_live_at, go_live_by, company_name')
      .limit(1)
      .maybeSingle()

    let resetDoneByProfile: any = null
    if (settings?.go_live_by) {
      const { data: p } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', settings.go_live_by)
        .maybeSingle()
      resetDoneByProfile = p
    }

    const currentYear = new Date().getFullYear()

    return {
      success: true,
      role: profile.role,
      userFullName: profile.full_name,
      settings: {
        goLiveCompleted: Boolean(settings?.go_live_completed),
        goLiveAt: settings?.go_live_at || null,
        goLiveBy: resetDoneByProfile ? resetDoneByProfile.full_name : null,
      },
      counts: {
        customers: cntCustomers || 0,
        vehicles: cntVehicles || 0,
        drivers: cntDrivers || 0,
        quotations: cntQuotations || 0,
        quotationItems: cntQuotationItems || 0,
        bookings: cntBookings || 0,
        bookingVehicles: cntBookingVehicles || 0,
        invoices: cntInvoices || 0,
        invoiceItems: cntInvoiceItems || 0,
        payments: cntPayments || 0,
        receipts: cntReceipts || 0,
        rentalAgreements: cntAgreements || 0,
        documentActivityLogs: cntDocumentLogs || 0,
      },
      expectedNextNumbers: {
        customerCode: 'CUS-000001',
        vehicleCode: 'VEH-000001',
        driverCode: 'DRV-000001',
        quotationNumber: `QT-${currentYear}-000001`,
        bookingNumber: `BK-${currentYear}-000001`,
        invoiceNumber: `INV-${currentYear}-000001`,
        receiptNumber: `RCPT-${currentYear}-000001`,
        agreementNumber: `AGR-${currentYear}-000001`,
      },
    }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to retrieve Go Live Reset summary.' }
  }
}

export async function exportTestDataCSV(entity: 'customers' | 'vehicles' | 'drivers' | 'quotations') {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Not authenticated.' }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'owner') {
      return { success: false, error: 'Permission denied.' }
    }

    const { data: rows } = await supabase
      .from(entity)
      .select('*')

    if (!rows || rows.length === 0) {
      return { success: false, error: `No records found in ${entity}.` }
    }

    // Convert JSON rows to CSV string
    const headers = Object.keys(rows[0])
    const csvLines = [
      headers.join(','),
      ...rows.map((row) =>
        headers
          .map((h) => {
            const val = row[h]
            if (val === null || val === undefined) return '""'
            const str = String(val).replace(/"/g, '""')
            return `"${str}"`
          })
          .join(',')
      ),
    ]

    return {
      success: true,
      filename: `${entity}-backup-${new Date().toISOString().slice(0, 10)}.csv`,
      csvContent: csvLines.join('\n'),
    }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to generate CSV backup.' }
  }
}

export async function executeGoLiveResetAction(input: {
  confirmation: string
  reason: string
  deleteCategories: boolean
}) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Not authenticated.' }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'owner') {
      return { success: false, error: 'Permission denied. Only the System Owner may execute Go Live Reset.' }
    }

    if (input.confirmation !== 'GO LIVE RESET') {
      return { success: false, error: 'Invalid confirmation phrase. You must type GO LIVE RESET.' }
    }

    // Invoke RPC perform_go_live_reset
    const { data: result, error: rpcErr } = await supabase.rpc('perform_go_live_reset', {
      p_confirmation: input.confirmation,
      p_reason: input.reason || 'Preparing system for production use.',
      p_delete_vehicle_categories: Boolean(input.deleteCategories),
    })

    if (rpcErr) {
      return { success: false, error: rpcErr.message || 'Failed to execute database reset.' }
    }

    // Revalidate paths across the dashboard
    revalidatePath('/dashboard/go-live-reset')
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/customers')
    revalidatePath('/dashboard/vehicles')
    revalidatePath('/dashboard/drivers')
    revalidatePath('/dashboard/quotations')
    revalidatePath('/dashboard/bookings')
    revalidatePath('/dashboard/invoices')
    revalidatePath('/dashboard/receipts')
    revalidatePath('/dashboard/agreements')

    return { success: true, result }
  } catch (err: any) {
    return { success: false, error: err.message || 'Unexpected error during Go Live Reset.' }
  }
}
