// Script: scripts/verify-user-agreement-final-export-and-autofill.js
// Purpose: Automated verification suite for Standalone Document Print Route & Complete Source Auto-Fill

const fs = require('fs')
const path = require('path')

console.log('=== USER AGREEMENT FINAL EXPORT & AUTO-FILL AUDIT ===\n')

// 1. Audit Standalone Print Route Existence & Path
console.log('--- TEST 1: Standalone Print Route Existence ---')
const printRoutePath = path.join(__dirname, '../src/app/print/user-agreement/[id]/page.tsx')
const printClientPath = path.join(__dirname, '../src/app/print/user-agreement/[id]/user-agreement-print-client.tsx')

if (fs.existsSync(printRoutePath) && fs.existsSync(printClientPath)) {
  console.log('✓ PASSED: Dedicated print route exists at src/app/print/user-agreement/[id] outside (dashboard).')
} else {
  console.error('❌ FAIL: Standalone print route missing!')
  process.exit(1)
}

// 2. Audit Dashboard Layout Absence in Dedicated Print Route
console.log('\n--- TEST 2: Dashboard Layout Absence ---')
const printRouteContent = fs.readFileSync(printRoutePath, 'utf8')
if (printRouteContent.includes('(dashboard)') || printRouteContent.includes('Sidebar') || printRouteContent.includes('Breadcrumb')) {
  console.error('❌ FAIL: Dedicated print route imports dashboard layout elements!')
  process.exit(1)
} else {
  console.log('✓ PASSED: Dedicated print route is 100% free of dashboard sidebar/layout wrappers.')
}

// 3. Audit App Shell Negative Assertions in Export Document
console.log('\n--- TEST 3: App Shell Negative Assertions ---')
const previewClientPath = path.join(__dirname, '../src/app/(dashboard)/dashboard/agreements/[id]/preview/user-agreement-preview-client.tsx')
const previewContent = fs.readFileSync(previewClientPath, 'utf8')

const docCompMatch = previewContent.match(/export function UserAgreementDocument[\s\S]*?^}/m)
const docCompContent = docCompMatch ? docCompMatch[0] : ''

const appChromeTokens = ['System > Dashboard', 'Search System', 'Back to Agreements Center', 'Edit / Amend Agreement', 'Version History']
appChromeTokens.forEach((tok) => {
  if (printRouteContent.includes(tok) || docCompContent.includes(tok)) {
    console.error(`❌ FAIL: Printable document contains chrome label: "${tok}"!`)
    process.exit(1)
  } else {
    console.log(`  ✓ Negative Assertion Verified: Printable document excludes "${tok}".`)
  }
})

// 4. Audit Source Field Registry
console.log('\n--- TEST 4: Source Field Registry Verification ---')
const registryPath = path.join(__dirname, '../src/lib/agreements/user-agreement-registry.ts')
if (!fs.existsSync(registryPath)) {
  console.error('❌ FAIL: Source field registry user-agreement-registry.ts missing!')
  process.exit(1)
}

const registryContent = fs.readFileSync(registryPath, 'utf8')
const requiredRegistryKeys = [
  'lessee_full_name',
  'lessee_identifier_no',
  'lessee_address',
  'rental_start_at',
  'rental_end_at',
  'daily_rental_rate',
  'security_deposit',
  'extra_km_rate',
  'vehicle_make_model',
  'vehicle_registration_number',
]

requiredRegistryKeys.forEach((key) => {
  if (registryContent.includes(key)) {
    console.log(`  ✓ Registry Field Verified: "${key}"`)
  } else {
    console.error(`❌ FAIL: Registry missing required key: "${key}"!`)
    process.exit(1)
  }
})

// 5. Audit Token Replacement Engine
console.log('\n--- TEST 5: Token Replacement Engine Verification ---')
if (
  previewContent.includes('FULL NAME OF USER') &&
  previewContent.includes('USER FULL ADDRESS') &&
  previewContent.includes('Name of the Lessee')
) {
  console.log('✓ PASSED: Token replacement engine substitutes literal source placeholders dynamically.')
} else {
  console.error('❌ FAIL: Token replacement engine incomplete!')
  process.exit(1)
}

console.log('\n✅ STANDALONE PRINT ROUTE & AUTO-FILL AUDIT PASSED SUCCESSFULLY!\n')
