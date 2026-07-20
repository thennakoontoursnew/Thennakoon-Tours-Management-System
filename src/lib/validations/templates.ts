import { z } from 'zod'

export const documentTemplateSchema = z.object({
  id: z.string().uuid().optional(),
  document_type: z.enum(['quotation', 'invoice', 'receipt', 'rental_agreement']),
  special_notes: z.string().optional().nullable(),
  important_message: z.string().optional().nullable(),
  bank_account_name: z.string().optional().nullable(),
  bank_name: z.string().optional().nullable(),
  bank_branch: z.string().optional().nullable(),
  bank_account_number: z.string().optional().nullable(),
  bank_swift_code: z.string().optional().nullable(),
  payment_instructions: z.string().optional().nullable(),
  prepared_by_designation: z.string().optional().nullable(),
  company_name: z.string().optional().nullable(),
  default_terms_and_conditions: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
})
