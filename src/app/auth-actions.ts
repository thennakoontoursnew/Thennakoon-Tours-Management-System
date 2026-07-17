'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { ownerSetupSchema, loginSchema, resetPasswordSchema } from '@/lib/validations/auth'

// 1. Check if owner exists
export async function checkOwnerExists() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('check_owner_exists')
    if (error) {
      console.error('Error checking owner existence:', error)
      return { exists: false, error: error.message }
    }
    return { exists: !!data }
  } catch (err: any) {
    return { exists: false, error: err.message }
  }
}

// 2. Register first owner
export async function registerOwner(values: z.infer<typeof ownerSetupSchema>) {
  try {
    const ownerCheck = await checkOwnerExists()
    if (ownerCheck.exists) {
      return { success: false, error: 'An owner account already exists.' }
    }

    const supabase = await createClient()

    // Sign up first user. Database trigger on auth.users will automatically 
    // assign 'owner' role because the profiles table is empty.
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
        data: {
          full_name: values.fullName,
          role: 'owner',
        },
      },
    })

    if (error) {
      return { success: false, error: error.message }
    }

    if (!data.user) {
      return { success: false, error: 'Sign up failed.' }
    }

    // Since we need to log in, we authenticate the user immediately
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    })

    if (signInError) {
      return { success: false, error: 'Registered but automatic login failed: ' + signInError.message }
    }

    // Log audit log
    await supabase.rpc('log_audit_action_internal', {
      p_action: 'CREATE_OWNER',
      p_entity_type: 'profile',
      p_entity_id: data.user.id,
      p_description: `Initial owner profile created for ${values.fullName}`,
    })

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
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
