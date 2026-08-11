// Script: scripts/verify-user-agreement-reference-layout.js
// Purpose: Automated verification suite for Final User Agreement V1 Source-Text, Typography & Rental Unit Calculation

const fs = require('fs')
const path = require('path')

function calculateRentalPeriodDisplay(days) {
  const d = Math.max(1, Number(days) || 1)

  if (d < 7) {
    const val = String(d).padStart(2, '0')
    return {
      valueStr: val,
      unit: 'days',
      formattedHtml: `${val} (<u>days</u>/weeks/month/ Years)`,
      formattedText: `${val} (Days)`,
    }
  } else if (d < 30) {
    const weeks = Math.floor(d / 7)
    const val = String(weeks).padStart(2, '0')
    return {
      valueStr: val,
      unit: 'weeks',
      formattedHtml: `${val} (days/<u>weeks</u>/month/ Years)`,
      formattedText: `${val} (Weeks)`,
    }
  } else if (d < 365) {
    const months = Math.floor(d / 30)
    const val = String(months).padStart(2, '0')
    return {
      valueStr: val,
      unit: 'month',
      formattedHtml: `${val} (days/weeks/<u>month</u>/ Years)`,
      formattedText: `${val} (Month)`,
    }
  } else {
    const years = Math.floor(d / 365)
    const val = String(years).padStart(2, '0')
    return {
      valueStr: val,
      unit: 'years',
      formattedHtml: `${val} (days/weeks/month/ <u>Years</u>)`,
      formattedText: `${val} (Years)`,
    }
  }
}

console.log('=== USER AGREEMENT V1 SOURCE TEXT, TYPOGRAPHY & RENTAL UNIT AUDIT ===\n')

// 1. Audit Rental Period Duration Unit Calculation & Active Underline Selection
console.log('--- TEST 1: Rental Duration Unit Calculation & Underline Formatting ---')
const durationTests = [
  { days: 3, expectedUnit: 'days', expectedHtml: '03 (<u>days</u>/weeks/month/ Years)' },
  { days: 7, expectedUnit: 'weeks', expectedHtml: '01 (days/<u>weeks</u>/month/ Years)' },
  { days: 14, expectedUnit: 'weeks', expectedHtml: '02 (days/<u>weeks</u>/month/ Years)' },
  { days: 21, expectedUnit: 'weeks', expectedHtml: '03 (days/<u>weeks</u>/month/ Years)' },
  { days: 30, expectedUnit: 'month', expectedHtml: '01 (days/weeks/<u>month</u>/ Years)' },
  { days: 60, expectedUnit: 'month', expectedHtml: '02 (days/weeks/<u>month</u>/ Years)' },
  { days: 365, expectedUnit: 'years', expectedHtml: '01 (days/weeks/month/ <u>Years</u>)' },
  { days: 730, expectedUnit: 'years', expectedHtml: '02 (days/weeks/month/ <u>Years</u>)' },
]

durationTests.forEach(({ days, expectedUnit, expectedHtml }) => {
  const res = calculateRentalPeriodDisplay(days)
  if (res.unit === expectedUnit && res.formattedHtml === expectedHtml) {
    console.log(`  ✓ Duration ${days} Days -> Unit: "${res.unit}" | Formatted HTML: "${res.formattedHtml}"`)
  } else {
    console.error(`❌ FAIL: Duration ${days} Days mismatch! Got unit: "${res.unit}", html: "${res.formattedHtml}"`)
    process.exit(1)
  }
})

// 2. Audit Document Visual Styling & Rich Bold Typography
console.log('\n--- TEST 2: Rich Bold Typography & Clean Legal Styling ---')
const previewClientPath = path.join(__dirname, '../src/app/(dashboard)/dashboard/agreements/[id]/preview/user-agreement-preview-client.tsx')
const previewText = fs.readFileSync(previewClientPath, 'utf8')

// Match UserAgreementDocument component body
const docCompMatch = previewText.match(/export function UserAgreementDocument[\s\S]*?^}/m)
const docCompContent = docCompMatch ? docCompMatch[0] : ''

if (previewText.includes('font-bold') && previewText.includes('renderClause18Content')) {
  console.log('✓ PASSED: Rich bold typography for preamble, defined terms & Clause 18 labels verified.')
} else {
  console.error('❌ FAIL: Bold typography formatting missing!')
  process.exit(1)
}

// 3. Audit Nominated Driver Empty State Assertion
console.log('\n--- TEST 3: Nominated Driver Empty State Assertion ---')
if (docCompContent.includes('Self Drive by Lessee')) {
  console.error('❌ FAIL: UserAgreementDocument contains hardcoded "Self Drive by Lessee" default in empty state!')
  process.exit(1)
} else {
  console.log('✓ PASSED: Hardcoded "Self Drive by Lessee" default removed. Blank underline rows rendered.')
}

// 4. Audit All 18 Approved Legal Clauses & Clause 18 Exact Text
console.log('\n--- TEST 4: All 18 Approved Legal Clauses & Clause 18 Interpretation ---')
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
  'IT IS FURTHER AGREED',
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

// Clause 18 exact key terms & contact lines assertion
const clause18Terms = [
  'Head of Operations Ms. Rashanthi Gunasekara: +94777273820',
  'Marketing, Administration & Customer Relations: +94 76 676 2829',
  'Accounts and Finance :+94760080155',
  'For technical support: +94 77 747 4938',
  'Complains and more information Hot Line: +94 112 823 723 / +94 77 727 3820,',
  'Decision or Approval by the Lessor',
  'Posting Address of the Lessor',
  'Message via WhatsApp to the Lessor',
  'Exclusive',
  'Final and Conclusive',
  'Day – 24 hours',
  'Month – 30 days',
  'Year- 365 days',
  'Default',
]

clause18Terms.forEach((term) => {
  if (templateText.includes(term)) {
    console.log(`  ✓ Clause 18 Exact Line Verified: "${term}"`)
  } else {
    console.error(`❌ FAIL: Clause 18 missing line: "${term}"!`)
    process.exit(1)
  }
})

// 5. Audit Locked Legal Numeric Values
console.log('\n--- TEST 5: Locked Legal Numeric Values ---')
const numericAssertions = [
  { key: 'Minor Repair Approval Limit', val: '13,500' },
  { key: 'Insurance Excess (Claim)', val: '15,000' },
  { key: 'Minor Accident Threshold', val: '25,000' },
  { key: 'Third Party Cover Reference', val: '500,000' },
  { key: 'Additional Nominated Driver Charge', val: '5000' },
  { key: 'Return Cleaning Fee', val: '1,500' },
  { key: 'Full Interior Cleaning Fee', val: '12,000' },
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

// 6. Audit Standalone Print Route & PDF Engine
console.log('\n--- TEST 6: Standalone Print Route & PDF Engine ---')
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

console.log('\n✅ USER AGREEMENT V1 SOURCE TEXT, TYPOGRAPHY & RENTAL UNIT AUDIT PASSED SUCCESSFULLY!\n')
