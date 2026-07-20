'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface QuickCustomerInput {
  full_name: string
  mobile: string
  nic?: string | null
  email?: string | null
  company_name?: string | null
  address?: string | null
}

export async function createQuickCustomer(input: QuickCustomerInput) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated.' }

    if (!input.full_name?.trim()) return { success: false, error: 'Customer name is required.' }
    if (!input.mobile?.trim()) return { success: false, error: 'Mobile phone number is required.' }

    // Generate Customer Code (e.g., CUS-001004)
    const { data: maxCust } = await supabase
      .from('customers')
      .select('customer_code')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    let nextNum = 1001
    if (maxCust?.customer_code) {
      const match = maxCust.customer_code.match(/\d+/)
      if (match) nextNum = parseInt(match[0], 10) + 1
    }
    const customerCode = `CUS-${String(nextNum).padStart(6, '0')}`

    const addressVal = input.address?.trim() || null

    const payload = {
      customer_code: customerCode,
      full_name: input.full_name.trim(),
      mobile: input.mobile.trim(),
      nic: input.nic?.trim() || null,
      email: input.email?.trim() ? input.email.trim().toLowerCase() : null,
      company_name: input.company_name?.trim() || null,
      address: addressVal,
      address_line_1: addressVal,
      created_by: user.id,
      updated_by: user.id,
      is_archived: false,
    }

    const { data: newCust, error } = await supabase
      .from('customers')
      .insert(payload)
      .select()
      .single()

    if (error || !newCust) {
      return { success: false, error: error?.message || 'Failed to create customer record.' }
    }

    revalidatePath('/dashboard/customers')
    revalidatePath('/dashboard/quotations/new')

    return { success: true, customer: newCust }
  } catch (err: any) {
    return { success: false, error: err.message || 'Unexpected error creating customer.' }
  }
}
