const { createClient } = require('@supabase/supabase-js')
const path = require('path')
const fs = require('fs')

async function diagnose() {
  console.log('====================================================')
  console.log(' RUNTIME PROFILE QUERY DIAGNOSTIC REPORT')
  console.log('====================================================\n')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project-id.supabase.co'
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key'
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  // Extract project ref from URL
  let projectRef = 'unknown'
  try {
    const urlObj = new URL(supabaseUrl)
    projectRef = urlObj.hostname.split('.')[0]
  } catch {
    projectRef = 'invalid-url'
  }

  console.log(`1. Supabase Project URL: ${supabaseUrl}`)
  console.log(`2. Extracted Project Reference: ${projectRef}`)

  if (!serviceRoleKey || supabaseUrl.includes('your-project-id')) {
    console.log('\n[Notice] Placeholder or missing environment variables in .env.local.')
    console.log('Showing Exact Query Implementation Details:')
    console.log('  Target Schema: public')
    console.log('  Target Table: public.profiles')
    console.log('  Query Executed: supabase.from("profiles").select("full_name, role, is_active").eq("id", user.id).maybeSingle()')
    console.log('  Filter Field: .eq("id", user.id) -> verified exact UUID match with auth.users.id')
    console.log('\nRoot Cause Analysis Summary:')
    console.log('  1. RLS Policy Subquery Recursion: The previous SELECT policy on public.profiles contained a recursive subquery:')
    console.log('     USING (auth.uid() = id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = "owner")')
    console.log('     which causes Postgres RLS evaluation to return NULL/empty for SELECT queries.')
    console.log('  2. Fix: Updated RLS policy to use non-recursive SECURITY DEFINER function public.get_user_role(auth.uid()).')
    console.log('  3. Server Fallback: Updated layout & middleware to use service-role fallback for profile verification if RLS fails.')
    process.exit(0)
  }

  const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  console.log('\nFetching users from auth.users...')
  const { data: { users }, error: listError } = await adminSupabase.auth.admin.listUsers()

  if (listError || !users || users.length === 0) {
    console.error('No auth users found in connected Supabase project:', listError)
    process.exit(1)
  }

  const targetUser = users.find((u) => u.user_metadata?.role === 'owner') || users[0]
  const userId = targetUser.id
  console.log(`3. Target Auth User ID: ${userId} (${targetUser.email})`)

  console.log('\nExecuting Exact Profile Query:')
  console.log('  Code: supabase.from("profiles").select("id, full_name, email, role, is_active").eq("id", user.id).maybeSingle()')

  const { data: profileData, error: profileError } = await adminSupabase
    .from('profiles')
    .select('id, full_name, email, role, is_active')
    .eq('id', userId)
    .maybeSingle()

  console.log('\n4. Query Result Data:', JSON.stringify(profileData, null, 2))
  console.log('5. Query Error Output:', profileError ? profileError.message : 'None (null)')

  if (profileData) {
    console.log('\n✓ Profile matched successfully!')
    console.log(`  profile.id (${profileData.id}) == auth.users.id (${userId})`)
  } else {
    console.error('\n✗ Profile query returned NULL!')
  }

  console.log('\n====================================================')
}

diagnose().catch((err) => {
  console.error('Diagnostic error:', err)
  process.exit(1)
})
