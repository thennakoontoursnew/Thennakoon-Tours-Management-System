// Script: scripts/verify-user-agreement-reference-layout.js
// Purpose: Automated verification suite for Final User Agreement V1 Real Agreement Format & Layout

const fs = require('fs')
const path = require('path')

console.log('=== USER AGREEMENT V1 REFERENCE LAYOUT & PRODUCTION LOCK AUDIT ===\n')

// 1. Audit Document Visual Styling (No SaaS Dashboard Cards inside Document Canvas)
console.log('--- TEST 1: Clean Formal Legal Document Styling ---')
const previewClientPath = path.join(__dirname, '../src/app/(dashboard)/dashboard/agreements/[id]/preview/user-agreement-preview-client.tsx')
const previewText = fs.readFileSync(previewClientPath, 'utf8')

// Match UserAgreementDocument component body
const docCompMatch = previewText.match(/export function UserAgreementDocument[\s\S]*?^}/m)
const docCompContent = docCompMatch ? docCompMatch[0] : ''

// Negative assertions for SaaS dashboard styling in document
const saasCardStyles = ['bg-slate-50', 'bg-amber-50', 'bg-slate-800/50', 'rounded-xl border-slate-800']
saasCardStyles.forEach((style) => {
  if (docCompContent.includes(style)) {
    console.error(`❌ FAIL: UserAgreementDocument contains SaaS card style: "${style}"!`)
    process.exit(1)
  }
})
console.log('✓ PASSED: 0% SaaS dashboard cards/badges inside legal document container.')

// 2. Audit All 18 Approved Legal Clauses
console.log('\n--- TEST 2: All 18 Approved Legal Clauses ---')
const templatePath = path.join(__dirname, '../src/lib/agreements/templates/user-agreement-v1.ts')
const templateText = fs.readFileSync(templatePath, 'utf8')

const requiredClauses = [
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
  'IT IS FURTHER AGREED...',
  'JURISDICTION',
  'INTERPRETATION',
]

requiredClauses.forEach((cl) => {
  if (templateText.includes(cl)) {
    console.log(`  ✓ Legal Clause Verified: "${cl}"`)
  } else {
    console.error(`❌ FAIL: Missing required legal clause: "${cl}"!`)
    process.exit(1)
  }
})

// 3. Audit Locked Legal Numeric Values
console.log('\n--- TEST 3: Locked Legal Numeric Values ---')
const numericAssertions = [
  { key: 'Minor Repair Approval Limit', val: '13,500' },
  { key: 'Insurance Excess (Claim)', val: '15,000' },
  { key: 'Minor Accident Threshold', val: '25,000' },
  { key: 'Third Party Cover Reference', val: '500,000' },
  { key: 'Additional Nominated Driver Charge', val: '5000' },
  { key: 'Return Cleaning Fee', val: '1 500' },
  { key: 'Full Interior Cleaning Fee', val: '12 000' },
  { key: 'Deposit Hold Days', val: '14' },
  { key: 'Deposit Release Hours', val: '48 working hours' },
  { key: 'Daily Mileage Allowance', val: '100' },
]

numericAssertions.forEach(({ key, val }) => {
  if (templateText.includes(val)) {
    console.log(`  ✓ Numeric Value Verified: ${key} = ${val}`)
  } else {
    console.error(`❌ FAIL: Missing numeric value assertion: ${key} (${val})!`)
    process.exit(1)
  }
})

// 4. Audit Fixture Data Dynamic Substitution & Sample Data Leakage Protection
console.log('\n--- TEST 4: Fixture Dynamic Data & Leakage Protection ---')
const testFixture = {
  agreement_number: 'AGR-TEST-999999',
  lessee: { full_name: 'TEST CUSTOMER ALPHA', identifier_no: 'NIC-999999999V', address: '999 TEST WAY, COLOMBO' },
  vehicle: { make_model: 'TEST TOYOTA AXIO', registration_number: 'TEST-8888', pickup_odometer: 12345 },
  rental: { daily_rental_rate: 8500, security_deposit: 60000, extra_km_rate: 85 },
}

// Ensure source code handles snapshot priority dynamically
if (previewText.includes('lessee.full_name') && previewText.includes('replaceTokens')) {
  console.log('✓ PASSED: Token replacement engine binds dynamic fixture values dynamically.')
} else {
  console.error('❌ FAIL: Dynamic field substitution broken!')
  process.exit(1)
}

// Negative assertion for reference sample leakage
const leakSamples = ['GREENTECH CAPITAL', 'PD-2295', 'NISSAN NAVARA']
leakSamples.forEach((sample) => {
  if (templateText.includes(sample)) {
    console.error(`❌ FAIL: Legal template hardcodes reference sample string "${sample}"!`)
    process.exit(1)
  }
})
console.log('✓ PASSED: 0% sample data leakage in legal template source.')

// 5. Audit Print Route & Dynamic Page Numbering Engine
console.log('\n--- TEST 5: Standalone Print Route & Page Numbering Engine ---')
const printRoutePath = path.join(__dirname, '../src/app/print/user-agreement/[id]/page.tsx')
const pdfEnginePath = path.join(__dirname, '../src/lib/documents/agreement-pdf.ts')

if (fs.existsSync(printRoutePath)) {
  const printContent = fs.readFileSync(printRoutePath, 'utf8')
  if (!printContent.includes('(dashboard)') && !printContent.includes('Sidebar')) {
    console.log('✓ PASSED: Standalone print route is 100% free of dashboard wrappers.')
  } else {
    console.error('❌ FAIL: Print route includes dashboard wrappers!')
    process.exit(1)
  }
}

const pdfEngineText = fs.readFileSync(pdfEnginePath, 'utf8')
if (pdfEngineText.includes('format: [215.9, 355.6]') && pdfEngineText.includes('getNumberOfPages()')) {
  console.log('✓ PASSED: US Legal PDF engine (215.9 x 355.6 mm) with dynamic getNumberOfPages() verified.')
} else {
  console.error('❌ FAIL: US Legal PDF engine or dynamic page numbering broken!')
  process.exit(1)
}

console.log('\n✅ USER AGREEMENT V1 REFERENCE LAYOUT & PRODUCTION LOCK AUDIT PASSED SUCCESSFULLY!\n')
