'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { documentTemplateSchema } from '@/lib/validations/templates'
import { z } from 'zod'

type TemplateInput = z.infer<typeof documentTemplateSchema>

export async function getDocumentTemplates() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('document_templates')
      .select('*')
      .order('document_type')

    if (error) return { success: false, error: error.message, templates: [] }
    return { success: true, templates: data || [] }
  } catch (err: any) {
    return { success: false, error: err.message, templates: [] }
  }
}

export async function getDocumentTemplateByType(type: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('document_templates')
      .select('*')
      .eq('document_type', type)
      .single()

    if (error || !data) return { success: false, error: error?.message || 'Template not found' }
    return { success: true, template: data }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function updateDocumentTemplate(type: string, values: Partial<TemplateInput>) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated.' }

    const { error } = await supabase
      .from('document_templates')
      .update({
        title: values.title,
        special_notes: values.special_notes?.trim() || null,
        important_message: values.important_message?.trim() || null,
        bank_details: values.bank_details || {},
        prepared_by_label: values.prepared_by_label?.trim() || null,
        default_terms: values.default_terms?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('document_type', type)

    if (error) return { success: false, error: error.message }

    await supabase.rpc('log_audit_action_internal', {
      p_action: 'UPDATE_DOCUMENT_TEMPLATE',
      p_entity_type: 'document_template',
      p_entity_id: type,
      p_description: `Updated document template for ${type}`,
    })

    revalidatePath('/dashboard/document-templates')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update template.' }
  }
}
