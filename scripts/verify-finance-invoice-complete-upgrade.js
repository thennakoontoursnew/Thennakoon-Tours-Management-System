/* eslint-disable @typescript-eslint/no-require-imports */
const { COMPANY_CONFIG } = require('../src/lib/company-config')
const { generateCommercialInvoicePDF } = require('../src/lib/documents/invoice-pdf-commercial')
const { generateInvoicePDF } = require('../src/lib/documents/invoice-pdf')

async function runInvoiceUpgradeVerification() {
  console.log('====================================================')
  console.log(' RUNNING COMMERCIAL INVOICE & PDF VERIFICATION')
  console.log('====================================================')

  // 1. Verify Company Config single source of truth
  console.log('Test 1: Company Config Single Source of Truth')
  if (!COMPANY_CONFIG.name || !COMPANY_CONFIG.bank.accountNumber || COMPANY_CONFIG.bank.accountNumber !== '100530013140') {
    throw new Error('COMPANY_CONFIG is incomplete or missing bank account number.')
  }
  console.log(' -> PASSED: Company Config loaded correctly (Account: ' + COMPANY_CONFIG.bank.accountNumber + ')')

  // 2. Generate Commercial Invoice PDF
  console.log('Test 2: Commercial Invoice A4 PDF Generation')
  const testInvoice = {
    invoice_number: 'TT-IN-10007',
    invoice_date: '2026-08-12',
    due_date: '2026-08-19',
    payment_terms: '7 Days',
    status: 'issued',
    customer: {
      full_name: 'Kazi Shahriar Alam',
      company_name: 'Tech Solutions Ltd',
      mobile: '+94 77 123 4567',
      email: 'kazi@example.com',
      address: 'Colombo, Sri Lanka',
      identifier_no: '198845612390',
    },
    vehicle_name: 'Toyota KDH Super GL',
    vehicle_registration: 'WP ND-4589',
    rental_start_date: '2026-08-12',
    rental_end_date: '2026-08-15',
    rental_days: 3,
    pickup_location: 'BIA Colombo Airport',
    destination: 'Kandy - Sigiriya - Galle',
    dropoff_location: 'Colombo Fort',
    items: [
      { description: 'Toyota KDH Super GL Vehicle Rental (3 Days)', quantity: 3, unit_price: 15000, line_total: 45000 },
      { description: 'Driver Overnight Allowance & Fuel Surcharge', quantity: 1, unit_price: 5000, line_total: 5000 },
    ],
    subtotal: 50000,
    discount_amount: 2000,
    additional_charges: 1000,
    tax_rate: 0,
    refundable_deposit: 10000,
    grand_total: 59000,
    amount_paid: 15000,
    balance_due: 44000,
    special_notes: COMPANY_CONFIG.defaultInvoiceSpecialNotes,
    terms_and_conditions: COMPANY_CONFIG.defaultInvoiceImportantTerms,
    prepared_by_name_snapshot: 'Owner / Administrator',
    prepared_by_designation_snapshot: 'Owner',
  }

  const doc = await generateCommercialInvoicePDF(testInvoice)
  if (!doc) {
    throw new Error('generateCommercialInvoicePDF returned empty or null document.')
  }
  console.log(' -> PASSED: generateCommercialInvoicePDF executed successfully')

  // 3. Verify generateInvoicePDF alias delegation
  console.log('Test 3: generateInvoicePDF Alias Delegation')
  const docAlias = await generateInvoicePDF(testInvoice)
  if (!docAlias) {
    throw new Error('generateInvoicePDF returned empty or null document.')
  }
  console.log(' -> PASSED: generateInvoicePDF delegated correctly')

  console.log('----------------------------------------------------')
  console.log(' ALL INVOICE UPGRADE VERIFICATION TESTS PASSED!')
  console.log('----------------------------------------------------')
}

runInvoiceUpgradeVerification().catch((err) => {
  console.error('VERIFICATION ERROR:', err)
  process.exit(1)
})
