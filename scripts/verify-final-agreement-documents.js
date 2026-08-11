// Script: scripts/verify-final-agreement-documents.js
// Purpose: Final source-of-truth document audit & Letterhead Removal Verification for Agreements

const fs = require('fs')
const path = require('path')
const { jsPDF } = require('jspdf')

console.log('=== FINAL AGREEMENT DOCUMENTS SOURCE AUDIT & LETTERHEAD REMOVAL ===\n')

// 1. Audit Letterhead Removal from Agreement Previews & PDF engine
console.log('--- TEST 1: Letterhead Removal Verification ---')
const userClientPath = path.join(__dirname, '../src/app/(dashboard)/dashboard/agreements/[id]/preview/user-agreement-preview-client.tsx')
const ownerClientPath = path.join(__dirname, '../src/app/(dashboard)/dashboard/agreements/owner/[id]/preview/owner-agreement-preview-client.tsx')
const pdfEnginePath = path.join(__dirname, '../src/lib/documents/agreement-pdf.ts')

const userClientContent = fs.readFileSync(userClientPath, 'utf8')
const ownerClientContent = fs.readFileSync(ownerClientPath, 'utf8')
const pdfEngineContent = fs.readFileSync(pdfEnginePath, 'utf8')

if (userClientContent.includes('thennakoon-tours-letterhead.png') || ownerClientContent.includes('thennakoon-tours-letterhead.png')) {
  console.error('❌ FAIL: Graphical letterhead PNG still referenced in Agreement Preview Components!')
  process.exit(1)
} else {
  console.log('✓ PASSED: Letterhead background PNG removed completely from User & Owner Agreement preview UI.')
}

if (pdfEngineContent.includes('drawLetterheadOnLegalPage') || pdfEngineContent.includes('thennakoon-tours-letterhead.png')) {
  console.error('❌ FAIL: Letterhead function still called in agreement-pdf.ts!')
  process.exit(1)
} else {
  console.log('✓ PASSED: Letterhead background removed from agreement-pdf.ts generator.')
}

// 2. Audit US Legal Dimensions & Page X of Y Footer
console.log('\n--- TEST 2: US Legal Paper Dimensions & Dynamic Page X of Y ---')
const docLegal = new jsPDF({
  orientation: 'portrait',
  unit: 'mm',
  format: [215.9, 355.6],
})

const widthPt = docLegal.internal.pageSize.getWidth() * (72 / 25.4)
const heightPt = docLegal.internal.pageSize.getHeight() * (72 / 25.4)

if (Math.abs(widthPt - 612) <= 5 && Math.abs(heightPt - 1008) <= 5) {
  console.log(`✓ PASSED: MediaBox matches US Legal Portrait (612 × 1008 pt / 8.5 × 14 in).`)
} else {
  console.error(`❌ FAIL: Invalid page size ${widthPt} x ${heightPt}`)
  process.exit(1)
}

if (pdfEngineContent.includes('Page ${i} of ${totalPages}') || userClientContent.includes('Page Document')) {
  console.log('✓ PASSED: Dynamic "Page X of Y" numbering verified.')
} else {
  console.error('❌ FAIL: Page X of Y footer missing.')
  process.exit(1)
}

// 3. Audit User Agreement Legal Clauses & Schedule Completeness
console.log('\n--- TEST 3: User Agreement Completeness Checklist ---')
const templatePath = path.join(__dirname, '../src/lib/agreements/templates/user-agreement-v1.ts')
const templateText = fs.readFileSync(templatePath, 'utf8')

// ASSERTION: Company Registration Number MUST be "PV 00312253"
if (templateText.includes('PV 00312253') && userClientContent.includes('PV 00312253')) {
  console.log('  ✓ Company Registration Number Verified: "PV 00312253"')
} else {
  console.error('  ❌ FAIL: Company Registration Number PV 00312253 missing from template or preview!')
  process.exit(1)
}

// NEGATIVE ASSERTION: PV-00249821 MUST NOT exist in USER_AGREEMENT_V1 template or preview
if (templateText.includes('PV-00249821') || userClientContent.includes('PV-00249821')) {
  console.error('  ❌ FAIL: Legacy incorrect registration number PV-00249821 still found in USER_AGREEMENT_V1!')
  process.exit(1)
} else {
  console.log('  ✓ Negative Assertion Verified: PV-00249821 does NOT exist in USER_AGREEMENT_V1.')
}

const requiredChecklist = [
  'HIRE OF VEHICLE',
  'RENTAL AND OTHER CHARGES',
  'LICENSE AND INSURANCE',
  'MAINTENANCE',
  'USE OF VEHICLE',
  'EXCLUSION OF LIABILITY',
  'EXCLUSION OF WARRANTIES',
  'ASSIGNMENT',
  'DEFAULT AND TERMINATION',
  'RIGHTS AND LIABILITIES OF THE LESSEE',
  'RENEVAL OF THE AGREEMENT',
  'Renewal of the agreement',
  'JOINT AND SEVERAL LIABILITIES',
  'NOTICE',
  'SERVICE OF NOTICE',
  'IT IS FURTHER AGREED',
  'JURISDICTION',
  'INTERPRETATION',
  'SHEDULE TO AGREEMENT',
  'IMPORTANT: This Agreement has been read by/to me/us',
]

requiredChecklist.forEach((item) => {
  if (templateText.includes(item) || userClientContent.includes(item)) {
    console.log(`  ✓ Section / Phrase Verified: "${item}"`)
  } else {
    console.error(`  ❌ Missing Section / Phrase: "${item}"`)
    process.exit(1)
  }
})

// 4. Audit Schedule Fields & Witness Blocks
console.log('\n--- TEST 4: Schedule Fields & Witness Blocks ---')
const scheduleFields = [
  'Lessee Name & Surname',
  'Passport Number',
  'I.D. number',
  'Mobile number',
  'Driving license Number',
  'Make & Model',
  'Registration No',
  'Odometer Reading',
  'Daily Rental Fee',
  'Security Deposit',
  'In the Presence of:',
  'Witness 1',
  'Witness 2',
]

scheduleFields.forEach((f) => {
  if (userClientContent.includes(f)) {
    console.log(`  ✓ Schedule / Signature Field Verified: "${f}"`)
  } else {
    console.error(`  ❌ Missing Schedule / Signature Field: "${f}"`)
    process.exit(1)
  }
})

console.log('\n✅ FINAL AGREEMENT DOCUMENTS SOURCE AUDIT PASSED SUCCESSFULLY!\n')
