'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import {
  getDefaultExtensionLetterSections,
  resolveExtensionLetterSections,
} from '@/lib/agreements/extension-template-renderer'
import { AgreementSection } from '@/lib/agreements/section-template-renderer'

const createExtensionSchema = z.object({
  agreement_type: z.enum(['user', 'owner']),
  user_agreement_id: z.string().uuid().optional().nullable(),
  owner_agreement_id: z.string().uuid().optional().nullable(),
  vehicle_reg_no: z.string().optional().nullable(),
  recipient_name: z.string().min(2, 'Recipient name is required'),
  issue_date: z.string().min(1, 'Issue date is required'),
  extension_period_type: z.enum(['fixed_period', 'until_further_notice']),
  extension_duration_label: z.string().min(1, 'Extension duration label is required'),
  new_end_date: z.string().optional().nullable(),
  renewal_amount: z.number().min(0).optional().nullable(),
  currency: z.string().default('LKR'),
  original_agreement_ref: z.string().optional().nullable(),
  custom_notes: z.string().optional().nullable(),
  issued_by_id: z.string().uuid().optional().nullable(),
  issued_by_name: z.string().min(2, 'Issuing officer name is required'),
  issued_by_designation: z.string().min(2, 'Issuing officer designation is required'),
  issued_by_signature_url: z.string().optional().nullable(),
})

export type CreateExtensionInput = z.infer<typeof createExtensionSchema>

async function getNextExtensionNumber(supabase: any): Promise<string> {
  try {
    const { data } = await supabase.rpc('generate_next_extension_number')
    if (data) return data
  } catch (_) {}
  return `EXT-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`
}

export async function createAgreementExtensionAction(values: CreateExtensionInput): Promise<{
  success: boolean
  extension?: any
  error?: string
}> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Not authenticated.' }

    const parsed = createExtensionSchema.safeParse(values)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message }
    }

    const d = parsed.data

    if (d.agreement_type === 'user' && !d.user_agreement_id) {
      return { success: false, error: 'Parent User Agreement ID is required.' }
    }
    if (d.agreement_type === 'owner' && !d.owner_agreement_id) {
      return { success: false, error: 'Parent Owner Agreement ID is required.' }
    }
    if (d.extension_period_type === 'fixed_period' && !d.new_end_date) {
      return { success: false, error: 'New End Date is required for a fixed duration extension.' }
    }

    const dbClient = process.env.SUPABASE_SERVICE_ROLE_KEY ? createAdminClient() : supabase

    // If issuing officer signature URL wasn't sent explicitly, look up their profile
    let resolvedSignatureUrl = d.issued_by_signature_url?.trim() || null
    if (!resolvedSignatureUrl && d.issued_by_id) {
      const { data: staffProf } = await dbClient
        .from('profiles')
        .select('signature_url')
        .eq('id', d.issued_by_id)
        .maybeSingle()
      if (staffProf?.signature_url) resolvedSignatureUrl = staffProf.signature_url
    }

    const extensionNumber = await getNextExtensionNumber(dbClient)

    const templateType = d.agreement_type === 'owner' ? 'owner_extension_letter' : 'user_extension_letter'
    const { data: activeTemplate } = await dbClient
      .from('document_templates')
      .select('sections_json, body_content')
      .eq('document_type', templateType)
      .maybeSingle()

    const rawTemplateSections: AgreementSection[] =
      Array.isArray(activeTemplate?.sections_json) && activeTemplate.sections_json.length > 0
        ? activeTemplate.sections_json
        : activeTemplate?.body_content
        ? [{ id: 'sec_ext_body', order: 1, title: 'Extension Letter', body: activeTemplate.body_content }]
        : getDefaultExtensionLetterSections(d.agreement_type)

    const snapshotInput = {
      extension_number: extensionNumber,
      agreement_type: d.agreement_type,
      vehicle_reg_no: d.vehicle_reg_no?.trim() || null,
      recipient_name: d.recipient_name.trim(),
      issue_date: d.issue_date,
      extension_period_type: d.extension_period_type,
      extension_duration_label: d.extension_duration_label.trim(),
      new_end_date: d.extension_period_type === 'fixed_period' ? d.new_end_date || null : null,
      renewal_amount:
        d.renewal_amount !== undefined && d.renewal_amount !== null && d.renewal_amount > 0
          ? Number(d.renewal_amount)
          : null,
      currency: d.currency || 'LKR',
      original_agreement_ref: d.original_agreement_ref?.trim() || null,
      custom_notes: d.custom_notes?.trim() || null,
    }

    const { resolvedSections, resolvedMarkdown } = resolveExtensionLetterSections(
      rawTemplateSections,
      snapshotInput
    )

    const insertPayload = {
      extension_number: extensionNumber,
      agreement_type: d.agreement_type,
      user_agreement_id: d.agreement_type === 'user' ? d.user_agreement_id : null,
      owner_agreement_id: d.agreement_type === 'owner' ? d.owner_agreement_id : null,
      vehicle_reg_no: snapshotInput.vehicle_reg_no,
      recipient_name: snapshotInput.recipient_name,
      issue_date: snapshotInput.issue_date,
      extension_period_type: snapshotInput.extension_period_type,
      extension_duration_label: snapshotInput.extension_duration_label,
      new_end_date: snapshotInput.new_end_date,
      renewal_amount: snapshotInput.renewal_amount,
      currency: snapshotInput.currency,
      original_agreement_ref: snapshotInput.original_agreement_ref,
      custom_notes: snapshotInput.custom_notes,
      issued_by_id: d.issued_by_id || user.id,
      issued_by_name: d.issued_by_name.trim(),
      issued_by_designation: d.issued_by_designation.trim(),
      issued_by_signature_url: resolvedSignatureUrl,
      rendered_content_snapshot: resolvedMarkdown,
      rendered_sections_snapshot: resolvedSections,
    }

    const { data: extension, error: insertError } = await dbClient
      .from('agreement_extensions')
      .insert(insertPayload)
      .select()
      .single()

    if (insertError || !extension) {
      return { success: false, error: insertError?.message || 'Failed to create extension letter.' }
    }

    // Auto-update Parent Agreement Dates & Extended Flag
    if (d.agreement_type === 'user' && d.user_agreement_id) {
      const { data: parentUserAgr } = await dbClient
        .from('rental_agreements')
        .select('id, rental_start_at, rental_end_at')
        .eq('id', d.user_agreement_id)
        .maybeSingle()

      if (parentUserAgr) {
        const userUpdate: Record<string, any> = {
          is_extended: true,
          updated_at: new Date().toISOString(),
        }
        if (d.extension_period_type === 'fixed_period' && d.new_end_date) {
          const candidateEndIso = `${d.new_end_date}T23:59:59.000Z`
          // Guard against check_agreement_dates (rental_end_at > rental_start_at)
          if (!parentUserAgr.rental_start_at || new Date(candidateEndIso) > new Date(parentUserAgr.rental_start_at)) {
            userUpdate.rental_end_at = candidateEndIso
          }
        }
        await dbClient.from('rental_agreements').update(userUpdate).eq('id', d.user_agreement_id)
      }
      revalidatePath(`/dashboard/agreements/${d.user_agreement_id}/preview`)
      revalidatePath(`/print/user-agreement/${d.user_agreement_id}`)
    } else if (d.agreement_type === 'owner' && d.owner_agreement_id) {
      const ownerUpdate: Record<string, any> = {
        is_extended: true,
        updated_at: new Date().toISOString(),
      }
      if (d.extension_period_type === 'fixed_period' && d.new_end_date) {
        ownerUpdate.agreement_end_date = d.new_end_date
      } else if (d.extension_period_type === 'until_further_notice') {
        ownerUpdate.agreement_end_date = null
      }
      if (d.renewal_amount !== undefined && d.renewal_amount !== null && d.renewal_amount > 0) {
        ownerUpdate.fixed_monthly_amount = Number(d.renewal_amount)
      }
      await dbClient.from('owner_agreements').update(ownerUpdate).eq('id', d.owner_agreement_id)
      revalidatePath(`/dashboard/agreements/owner/${d.owner_agreement_id}`)
      revalidatePath(`/dashboard/agreements/owner/${d.owner_agreement_id}/preview`)
    }

    try {
      await supabase.rpc('log_audit_action_internal', {
        p_action: 'CREATE_AGREEMENT_EXTENSION',
        p_entity_type: 'agreement_extension',
        p_entity_id: extension.id,
        p_description: `Issued extension letter ${extension.extension_number} (${d.agreement_type}) for ${d.recipient_name}`,
      })
    } catch (_) {}

    revalidatePath('/dashboard/agreements')
    return { success: true, extension }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to generate extension letter.' }
  }
}
