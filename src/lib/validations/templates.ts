import { z } from 'zod'

export const bankDetailsSchema = z.object({
  bank_name: z.string().optional().nullable(),
  bank_branch: z.string().optional().nullable(),
  bank_account_name: z.string().optional().nullable(),
  bank_account_number: z.string().optional().nullable(),
  bank_swift_code: z.string().optional().nullable(),
})

export const documentTemplateSchema = z.object({
  id: z.string().uuid().optional(),
  document_type: z.enum(['quotation', 'invoice', 'receipt', 'rental_agreement']),
  title: z.string().min(1, 'Title is required'),
  special_notes: z.string().optional().nullable(),
  important_message: z.string().optional().nullable(),
  bank_details: bankDetailsSchema.optional().nullable(),
  prepared_by_label: z.string().optional().nullable(),
  default_terms: z.string().optional().nullable(),
})
