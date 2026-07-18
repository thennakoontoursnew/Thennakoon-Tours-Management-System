'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { customerSchema, customerNoteSchema, sanitizePayload } from '@/lib/validations/master-data'
import { z } from 'zod'

type CustomerInput = z.infer<typeof customerSchema>

export async function createCustomer(values: CustomerInput, tagIds: string[] = []) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated.' }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single()

    if (!profile || !profile.is_active) {
      return { success: false, error: 'Unauthorized account.' }
    }

    const allowedRoles = ['owner', 'manager', 'booking_staff', 'operations_staff', 'finance_staff']
    if (!allowedRoles.includes(profile.role)) {
      return { success: false, error: 'You do not have permission to create customers.' }
    }

    const parsed = customerSchema.safeParse(values)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message }
    }

    // Sanitize payload: convert all empty strings "" to null for date & optional columns
    const sanitizedData = sanitizePayload(parsed.data)
    const payload = {
      ...sanitizedData,
      created_by: user.id,
      updated_by: user.id,
    }

    // Task requirement: Log exact payload immediately before inserting
    console.log('Customer insert payload', payload)

    // Insert customer record
    const { data: newCustomer, error: insertError } = await supabase
      .from('customers')
      .insert(payload)
      .select()
      .single()

    if (insertError || !newCustomer) {
      const msg = insertError?.message.toLowerCase() || ''
      if (msg.includes('nic')) return { success: false, error: 'A customer with this NIC already exists.' }
      if (msg.includes('passport')) return { success: false, error: 'A customer with this Passport Number already exists.' }
      return { success: false, error: insertError?.message || 'Failed to create customer record.' }
    }

    // Assign initial tags if provided
    if (tagIds.length > 0) {
      const tagRows = tagIds.map((tagId) => ({
        customer_id: newCustomer.id,
        tag_id: tagId,
        created_by: user.id,
      }))
      await supabase.from('customer_tag_assignments').insert(tagRows)
    }

    // Log Audit Action
    await supabase.rpc('log_audit_action_internal', {
      p_action: 'CREATE_CUSTOMER',
      p_entity_type: 'customer',
      p_entity_id: newCustomer.id,
      p_description: `Created customer ${newCustomer.customer_code} (${newCustomer.full_name})`,
      p_metadata: { customer_type: newCustomer.customer_type, mobile: newCustomer.mobile },
    })

    revalidatePath('/dashboard/customers')
    revalidatePath('/dashboard')
    return { success: true, customerId: newCustomer.id }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create customer.' }
  }
}

export async function updateCustomer(id: string, values: CustomerInput, tagIds?: string[]) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated.' }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single()

    if (!profile || !profile.is_active) {
      return { success: false, error: 'Unauthorized account.' }
    }

    const allowedRoles = ['owner', 'manager', 'booking_staff', 'operations_staff', 'finance_staff']
    if (!allowedRoles.includes(profile.role)) {
      return { success: false, error: 'You do not have permission to edit customers.' }
    }

    const parsed = customerSchema.safeParse(values)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message }
    }

    // Sanitize payload: convert all empty strings "" to null for date & optional columns
    const sanitizedData = sanitizePayload(parsed.data)
    const payload = {
      ...sanitizedData,
      updated_by: user.id,
    }

    console.log('Customer update payload', payload)

    const { error: updateError } = await supabase
      .from('customers')
      .update(payload)
      .eq('id', id)

    if (updateError) {
      const msg = updateError.message.toLowerCase()
      if (msg.includes('nic')) return { success: false, error: 'A customer with this NIC already exists.' }
      if (msg.includes('passport')) return { success: false, error: 'A customer with this Passport Number already exists.' }
      return { success: false, error: updateError.message }
    }

    // Update tags if passed
    if (tagIds !== undefined) {
      await supabase.from('customer_tag_assignments').delete().eq('customer_id', id)
      if (tagIds.length > 0) {
        const tagRows = tagIds.map((tagId) => ({
          customer_id: id,
          tag_id: tagId,
          created_by: user.id,
        }))
        await supabase.from('customer_tag_assignments').insert(tagRows)
      }
    }

    // Log Audit Action
    await supabase.rpc('log_audit_action_internal', {
      p_action: 'UPDATE_CUSTOMER',
      p_entity_type: 'customer',
      p_entity_id: id,
      p_description: `Updated customer details for ${parsed.data.full_name}`,
    })

    revalidatePath('/dashboard/customers')
    revalidatePath(`/dashboard/customers/${id}`)
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update customer.' }
  }
}

export async function archiveCustomer(id: string) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated.' }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single()

    if (!profile || !profile.is_active || !['owner', 'manager'].includes(profile.role)) {
      return { success: false, error: 'Only Owners and Managers can archive customers.' }
    }

    const { error } = await supabase
      .from('customers')
      .update({
        is_archived: true,
        archived_at: new Date().toISOString(),
        updated_by: user.id,
      })
      .eq('id', id)

    if (error) return { success: false, error: error.message }

    await supabase.rpc('log_audit_action_internal', {
      p_action: 'ARCHIVE_CUSTOMER',
      p_entity_type: 'customer',
      p_entity_id: id,
      p_description: 'Archived customer record',
    })

    revalidatePath('/dashboard/customers')
    revalidatePath('/dashboard/customers/archived')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to archive customer.' }
  }
}

export async function restoreCustomer(id: string) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated.' }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single()

    if (!profile || !profile.is_active || !['owner', 'manager'].includes(profile.role)) {
      return { success: false, error: 'Only Owners and Managers can restore customers.' }
    }

    const { error } = await supabase
      .from('customers')
      .update({
        is_archived: false,
        archived_at: null,
        updated_by: user.id,
      })
      .eq('id', id)

    if (error) return { success: false, error: error.message }

    await supabase.rpc('log_audit_action_internal', {
      p_action: 'RESTORE_CUSTOMER',
      p_entity_type: 'customer',
      p_entity_id: id,
      p_description: 'Restored customer record from archive',
    })

    revalidatePath('/dashboard/customers')
    revalidatePath('/dashboard/customers/archived')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to restore customer.' }
  }
}

export async function addCustomerNote(customerId: string, noteText: string) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated.' }

    const parsed = customerNoteSchema.safeParse({ customer_id: customerId, note: noteText })
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

    const { error } = await supabase.from('customer_notes').insert({
      customer_id: customerId,
      note: noteText,
      created_by: user.id,
    })

    if (error) return { success: false, error: error.message }

    await supabase.rpc('log_audit_action_internal', {
      p_action: 'ADD_CUSTOMER_NOTE',
      p_entity_type: 'customer_note',
      p_entity_id: customerId,
      p_description: 'Added note to customer timeline',
    })

    revalidatePath(`/dashboard/customers/${customerId}`)
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to add note.' }
  }
}
