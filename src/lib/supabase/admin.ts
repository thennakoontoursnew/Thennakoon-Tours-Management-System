import { createClient } from '@supabase/supabase-js'

/**
 * Creates a Supabase admin client using the service-role key.
 * IMPORTANT: This client has full administrative privileges and bypasses RLS.
 * It MUST ONLY be called in server-only contexts (Server Actions, Server Components, API routes).
 * NEVER expose SUPABASE_SERVICE_ROLE_KEY to the browser or in NEXT_PUBLIC_ variables.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error('Configuration Error: NEXT_PUBLIC_SUPABASE_URL is not configured in environment settings.')
  }

  if (!serviceRoleKey) {
    throw new Error('Configuration Error: SUPABASE_SERVICE_ROLE_KEY is not configured in environment settings.')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
