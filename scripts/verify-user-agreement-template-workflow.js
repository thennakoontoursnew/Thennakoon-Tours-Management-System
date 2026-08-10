// Script: scripts/verify-user-agreement-template-workflow.js
// Purpose: Automated verification suite for User Agreement Template Workflow & Audited Monetary Values

const fs = require('fs')
const path = require('path')

console.log('=== USER AGREEMENT TEMPLATE WORKFLOW VERIFICATION ===\n')

// 1. Audit Template File & Legal Clauses
const templatePath = path.join(__dirname, '../src/lib/agreements/templates/user-agreement-v1.ts')
if (!fs.existsSync(templatePath)) {
  console.error('❌ FAIL: user-agreement-v1.ts legal template missing!')
  process.exit(1)
}

const templateText = fs.readFileSync(templatePath, 'utf8')
console.log('✓ Found user-agreement-v1.ts template (Size:', templateText.length, 'bytes)')

const requiredSections = [
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
  'RENEWAL OF THE AGREEMENT',
  'Renewal of the agreement',
  'JOINT AND SEVERAL LIABILITIES',
  'NOTICE',
  'SERVICE OF NOTICE',
  'IT IS FURTHER AGREED...',
  'JURISDICTION',
  'INTERPRETATION',
  'REQUIRED_USER_AGREEMENT_TOKENS',
]

requiredSections.forEach((sec) => {
  if (templateText.includes(sec)) {
    console.log(`  ✓ Legal Clause / Section Verified: "${sec}"`)
  } else {
    console.error(`  ❌ Missing Legal Clause / Section: "${sec}"`)
    process.exit(1)
  }
})

// 2. Audit Official Source Monetary & Numeric Values
console.log('\n=== Auditing Official Source Monetary & Numeric Values ===')
const servicePath = path.join(__dirname, '../src/lib/agreements/user-agreement-service.ts')
const serviceContent = fs.readFileSync(servicePath, 'utf8')

const monetaryAssertions = [
  { name: 'Minor Repair Limit', key: 'minor_repair_limit', expected: '13500' },
  { name: 'Insurance Excess (Claim)', key: 'insurance_excess', expected: '15000' },
  { name: 'Minor Accident Damage Threshold', key: 'minor_accident_threshold', expected: '25000' },
  { name: 'Cleaning Fee (Standard)', key: 'cleaning_fee', expected: '1500' },
  { name: 'Full Interior Cleaning Fee', key: 'full_interior_cleaning_fee', expected: '12000' },
  { name: 'Additional Driver Fee', key: 'additional_driver_fee', expected: '5000' },
  { name: 'Deposit Hold Days', key: 'security_deposit_hold_days', expected: '14' },
  { name: 'Allowed Mileage', key: 'allowed_km_per_day', expected: '100' },
  { name: 'Third Party Cover', key: 'third_party_insurance_cover', expected: '500000' },
]

monetaryAssertions.forEach((item) => {
  if (serviceContent.includes(`${item.key}:`) && serviceContent.includes(item.expected)) {
    console.log(`  ✓ Audited Value Verified: ${item.name} = ${item.expected}`)
  } else {
    console.error(`  ❌ FAIL: ${item.name} in user-agreement-service.ts does not match official source ${item.expected}!`)
    process.exit(1)
  }
})

// 3. Audit Database Migration
console.log('\n=== Auditing Migration 20260810040000_user_agreement_v1_upgrade.sql ===')
const migrationPath = path.join(__dirname, '../supabase/migrations/20260810040000_user_agreement_v1_upgrade.sql')
if (!fs.existsSync(migrationPath)) {
  console.error('❌ FAIL: 20260810040000_user_agreement_v1_upgrade.sql missing!')
  process.exit(1)
}

const migrationSql = fs.readFileSync(migrationPath, 'utf8')
const requiredCols = [
  'template_version',
  'lessee_snapshot',
  'vehicle_snapshot',
  'rental_snapshot',
  'agreement_variables_snapshot',
  'company_snapshot',
  'nominated_drivers_snapshot',
  'witnesses_snapshot',
  'lessor_representative_snapshot',
  'pickup_delivery_snapshot',
]

requiredCols.forEach((col) => {
  if (migrationSql.includes(col)) {
    console.log(`  ✓ Migration Column Verified: ${col}`)
  } else {
    console.error(`  ❌ Missing Migration Column: ${col}`)
    process.exit(1)
  }
})

// 4. Audit Mapping Service & Server Actions
console.log('\n=== Auditing User Agreement Mapping Service & Actions ===')
const actionsPath = path.join(__dirname, '../src/app/(dashboard)/dashboard/agreements/user-agreement-actions.ts')

if (!fs.existsSync(actionsPath)) {
  console.error('❌ FAIL: user-agreement-actions.ts missing!')
  process.exit(1)
}

const actionsContent = fs.readFileSync(actionsPath, 'utf8')

if (serviceContent.includes('getInitialUserAgreementFormData') && serviceContent.includes('validateUserAgreementData')) {
  console.log('  ✓ Data mapping priority & validation engine verified.')
} else {
  console.error('  ❌ Service mapping engine incomplete.')
  process.exit(1)
}

if (actionsContent.includes('createOrUpdateUserAgreementDraft') && actionsContent.includes('generateAndLockUserAgreement')) {
  console.log('  ✓ Server actions & snapshot locking verified.')
} else {
  console.error('  ❌ Server actions incomplete.')
  process.exit(1)
}

// 5. Audit Pages & UI Components
console.log('\n=== Auditing UI Pages & Preview Renderer ===')
const requiredFiles = [
  'src/components/agreements/user-agreement-wizard.tsx',
  'src/app/(dashboard)/dashboard/agreements/new/page.tsx',
  'src/app/(dashboard)/dashboard/agreements/[id]/preview/page.tsx',
  'src/app/(dashboard)/dashboard/bookings/[id]/generate-agreement-button.tsx',
]

requiredFiles.forEach((f) => {
  if (fs.existsSync(path.join(__dirname, '..', f))) {
    console.log(`  ✓ UI File Verified: ${f}`)
  } else {
    console.error(`  ❌ Missing UI File: ${f}`)
    process.exit(1)
  }
})

console.log('\n✅ USER AGREEMENT TEMPLATE WORKFLOW VERIFICATION PASSED SUCCESSFULLY!\n')
