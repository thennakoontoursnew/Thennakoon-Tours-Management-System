'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function uploadEntitySignatureAction(formData: FormData): Promise<{
  success?: boolean
  signatureUrl?: string
  error?: string
}> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { error: 'Not authenticated.' }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_active')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile || !profile.is_active) {
      return { error: 'Unauthorized account.' }
    }

    const file = formData.get('signature_file') as File | null
    const folder = formData.get('entity_folder')?.toString() || 'entities'
    const entityId = formData.get('entity_id')?.toString() || 'draft'

    if (!file || typeof file === 'string' || file.size === 0) {
      return { error: 'Please select a valid signature image file.' }
    }

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    if (!validTypes.includes(file.type)) {
      return { error: 'Invalid file format. Please upload a PNG, JPG, or WEBP image.' }
    }

    if (file.size > 5 * 1024 * 1024) {
      return { error: 'Signature file size exceeds the 5MB limit.' }
    }

    const dbClient = process.env.SUPABASE_SERVICE_ROLE_KEY ? createAdminClient() : supabase

    try {
      await dbClient.storage.createBucket('signatures', { public: true })
    } catch (_) {}

    const safeFolder = ['owners', 'customers', 'staff', 'entities'].includes(folder) ? folder : 'entities'
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
    const storagePath = `${safeFolder}/${entityId}-${Date.now()}.${ext}`
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadErr } = await dbClient.storage
      .from('signatures')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadErr) {
      return { error: `Failed to upload signature: ${uploadErr.message}` }
    }

    const { data: urlData } = dbClient.storage.from('signatures').getPublicUrl(storagePath)
    return { success: true, signatureUrl: urlData.publicUrl }
  } catch (err: any) {
    return { error: err.message || 'Failed to upload E-signature.' }
  }
}
