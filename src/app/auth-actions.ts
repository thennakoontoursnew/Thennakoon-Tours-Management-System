'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { ownerSetupSchema, loginSchema, resetPasswordSchema } from '@/lib/validations/auth'

// 1. Check if owner exists with auto-repair capability
export async function checkOwnerExists() {
  try {
    const supabase = await createClient()
    
    // Check if an active owner profile exists in database
    const { data: ownerProfile } = await supabase
      .from('profiles')
      .select('id, role, is_active')
      .eq('role', 'owner')
      .eq('is_active', true)
      .maybeSingle()

    if (ownerProfile) {
      return { exists: true }
    }

    // Profile Repair: If SUPABASE_SERVICE_ROLE_KEY is configured, check auth.users for existing owner
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const adminSupabase = createAdminClient()
      const { data: { users } } = await adminSupabase.auth.admin.listUsers()

      if (users && users.length > 0) {
        const ownerAuthUser = users.find((u) => u.user_metadata?.role === 'owner') || users[0]
        if (ownerAuthUser) {
          // Repair profile safely
          await adminSupabase.from('profiles').upsert(
            {
              id: ownerAuthUser.id,
              full_name: ownerAuthUser.user_metadata?.full_name || 'System Owner',
              email: ownerAuthUser.email || '',
              role: 'owner',
              is_active: true,
            },
            { onConflict: 'id' }
          )

          return { exists: true }
        }
      }
    }

    return { exists: false }
  } catch (err: any) {
    return { exists: false, error: err.message }
  }
}

// 2. Register first owner using secure Server-Side Supabase Admin API
export async function registerOwner(values: z.infer<typeof ownerSetupSchema>) {
  try {
    // 1. Check missing server secret key early
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return {
        success: false,
        error: 'System configuration error: Missing server secret key (SUPABASE_SERVICE_ROLE_KEY). Please contact your administrator.',
      }
    }

    // 2. Check if an active owner already exists
    const ownerCheck = await checkOwnerExists()
    if (ownerCheck.exists) {
      return {
        success: false,
        error: 'An active owner account already exists in the system.',
      }
    }

    // 3. Validate input schema
    const validation = ownerSetupSchema.safeParse(values)
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0].message,
      }
    }

    // 4. Initialize Server-Only Admin Supabase Client
    const adminSupabase = createAdminClient()

    // 5. Create auth user via Admin API with auto-confirmed email
    const { data: adminAuthData, error: adminAuthError } =
      await adminSupabase.auth.admin.createUser({
        email: values.email,
        password: values.password,
        email_confirm: true,
        user_metadata: {
          full_name: values.fullName,
          role: 'owner',
        },
      })

    if (adminAuthError) {
      const msg = adminAuthError.message.toLowerCase()
      if (
        msg.includes('already registered') ||
        msg.includes('already exists') ||
        msg.includes('unique constraint') ||
        msg.includes('duplicate')
      ) {
        return {
          success: false,
          error: 'An account with this email address already exists.',
        }
      }
      return {
        success: false,
        error: `Failed to create owner auth user: ${adminAuthError.message}`,
      }
    }

    if (!adminAuthData.user) {
      return { success: false, error: 'Failed to create owner auth user record.' }
    }

    const userId = adminAuthData.user.id

    // 6. Explicitly Upsert Profile (Ensure role = 'owner', is_active = true)
    const { error: profileInsertError } = await adminSupabase
      .from('profiles')
      .upsert(
        {
          id: userId,
          full_name: values.fullName,
          email: values.email,
          role: 'owner',
          is_active: true,
        },
        { onConflict: 'id' }
      )

    if (profileInsertError) {
      console.error('Profile insertion error:', profileInsertError)
      return {
        success: false,
        error: `Profile creation failed: ${profileInsertError.message}`,
      }
    }

    // 7. IMMEDIATELY VERIFY: SELECT * FROM public.profiles WHERE id = userId
    const { data: verifiedProfile, error: verifyError } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (verifyError || !verifiedProfile) {
      console.error('Profile verification failed:', verifyError)
      return {
        success: false,
        error: 'Critical Error: Owner profile insertion could not be verified in public.profiles. Operation aborted.',
      }
    }

    if (verifiedProfile.role !== 'owner' || !verifiedProfile.is_active) {
      return {
        success: false,
        error: 'Critical Error: Owner profile role or active status is invalid. Operation aborted.',
      }
    }

    // 8. Sign in the newly created owner ONLY after profile insertion & verification succeeded
    const serverSupabase = await createClient()
    const { error: signInError } = await serverSupabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    })

    if (signInError) {
      return {
        success: false,
        error: `Owner account and profile created successfully, but automatic login failed: ${signInError.message}`,
      }
    }

    // 9. Update last login timestamp & log audit action
    await serverSupabase.rpc('update_last_login', { p_user_id: userId })
    await serverSupabase.rpc('log_audit_action_internal', {
      p_action: 'CREATE_OWNER',
      p_entity_type: 'profile',
      p_entity_id: userId,
      p_description: `Owner profile created and verified for ${values.fullName}`,
    })

    return { success: true }
  } catch (err: any) {
    console.error('registerOwner unexpected error:', err)
    return {
      success: false,
      error: err.message || 'An unexpected error occurred during owner registration.',
    }
  }
}

// 3. Login Action
export async function login(values: z.infer<typeof loginSchema>) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    if (!data.user) {
      return { success: false, error: 'Login failed.' }
    }

    // Query active status of user
    const { data: isActive, error: activeError } = await supabase.rpc('is_user_active', {
      p_user_id: data.user.id,
    })

    if (activeError || !isActive) {
      await supabase.auth.signOut()
      return { success: false, error: 'This account has been deactivated.' }
    }

    // Update last login
    await supabase.rpc('update_last_login', { p_user_id: data.user.id })

    // Log audit
    await supabase.rpc('log_audit_action_internal', {
      p_action: 'LOGIN',
      p_entity_type: 'profile',
      p_entity_id: data.user.id,
      p_description: 'User successfully logged in',
    })

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

// 4. Logout Action
export async function logout() {
  try {
    const supabase = await createClient()
    
    // Log audit before signing out
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.rpc('log_audit_action_internal', {
        p_action: 'LOGOUT',
        p_entity_type: 'profile',
        p_entity_id: user.id,
        p_description: 'User logged out',
      })
    }

    await supabase.auth.signOut()
  } catch (err) {
    console.error('Logout error:', err)
  }
  
  redirect('/login')
}

// 5. Request Forgot Password Link
export async function requestPasswordReset(email: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/(auth)/reset-password`,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

// 6. Reset Password Action
export async function resetPassword(values: z.infer<typeof resetPasswordSchema>) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.updateUser({
      password: values.password,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    if (data.user) {
      await supabase.rpc('log_audit_action_internal', {
        p_action: 'RESET_PASSWORD',
        p_entity_type: 'profile',
        p_entity_id: data.user.id,
        p_description: 'User reset their password successfully',
      })
    }

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}
