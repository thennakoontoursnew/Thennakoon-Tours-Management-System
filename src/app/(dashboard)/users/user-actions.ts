'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const VALID_ROLES = [
  'manager',
  'booking_staff',
  'operations_staff',
  'marketing_staff',
  'finance_staff',
  'viewer',
] as const

const createStaffSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  role: z.enum(VALID_ROLES, 'Invalid role selected'),
  phone: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export async function createStaffUser(values: {
  fullName: string
  email: string
  role: string
  phone?: string
  password: string
}) {
  const supabase = await createClient()

  const {
    data: { user: caller },
  } = await supabase.auth.getUser()

  if (!caller) return { success: false, error: 'Not authenticated.' }

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', caller.id)
    .single()

  if (!callerProfile || callerProfile.role !== 'owner') {
    return { success: false, error: 'Only the owner can create staff accounts.' }
  }

  // Validate role — cannot create another owner
  if (values.role === 'owner') {
    return { success: false, error: 'Cannot create additional owner accounts.' }
  }

  // Validate with Zod
  const parsed = createStaffSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  // Use service-role key only on the server
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { success: false, error: 'Server configuration missing: SUPABASE_SERVICE_ROLE_KEY is not defined.' }
  }

  const adminSupabase = createAdminClient()

  // Create auth user via service role
  const { data: newUser, error: createError } = await adminSupabase.auth.admin.createUser({
    email: values.email,
    password: values.password,
    email_confirm: true,
    user_metadata: {
      full_name: values.fullName,
      role: values.role,
      phone: values.phone,
    },
  })

  if (createError || !newUser.user) {
    return { success: false, error: createError?.message || 'Failed to create user.' }
  }

  // Audit log
  await supabase.rpc('log_audit_action_internal', {
    p_action: 'CREATE_STAFF',
    p_entity_type: 'profile',
    p_entity_id: newUser.user.id,
    p_description: `Owner created staff account for ${values.fullName} (${values.role})`,
  })

  revalidatePath('/dashboard/users')
  return { success: true }
}

export async function toggleUserActive(targetUserId: string, newActiveState: boolean) {
  const supabase = await createClient()

  const {
    data: { user: caller },
  } = await supabase.auth.getUser()

  if (!caller) return { success: false, error: 'Not authenticated.' }

  // Only owner can toggle
  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', caller.id)
    .single()

  if (!callerProfile || callerProfile.role !== 'owner') {
    return { success: false, error: 'Only the owner can change account status.' }
  }

  // Owner cannot deactivate themselves
  if (caller.id === targetUserId) {
    return { success: false, error: 'The owner cannot deactivate their own account.' }
  }

  // Check target is not another owner
  const { data: targetProfile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', targetUserId)
    .single()

  if (!targetProfile) return { success: false, error: 'User not found.' }
  if (targetProfile.role === 'owner') {
    return { success: false, error: 'Cannot change the status of the owner account.' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ is_active: newActiveState })
    .eq('id', targetUserId)

  if (error) return { success: false, error: error.message }

  await supabase.rpc('log_audit_action_internal', {
    p_action: newActiveState ? 'ACTIVATE_USER' : 'DEACTIVATE_USER',
    p_entity_type: 'profile',
    p_entity_id: targetUserId,
    p_description: `Owner ${newActiveState ? 'activated' : 'deactivated'} account: ${targetProfile.full_name}`,
  })

  revalidatePath('/dashboard/users')
  return { success: true }
}

export async function updateStaffRole(targetUserId: string, newRole: string) {
  const supabase = await createClient()

  const {
    data: { user: caller },
  } = await supabase.auth.getUser()

  if (!caller) return { success: false, error: 'Not authenticated.' }

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', caller.id)
    .single()

  if (!callerProfile || callerProfile.role !== 'owner') {
    return { success: false, error: 'Only the owner can change roles.' }
  }

  // Cannot assign owner role to others
  if (newRole === 'owner') {
    return { success: false, error: 'Cannot assign the owner role to other users.' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', targetUserId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/users')
  return { success: true }
}
