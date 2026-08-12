import { generateCommercialInvoicePDF } from './invoice-pdf-commercial'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function generateInvoicePDF(invoice: Record<string, unknown>, companySettings?: Record<string, unknown>) {
  if (!invoice) {
    throw new Error('Invoice data missing')
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return generateCommercialInvoicePDF(invoice as any)
}
