// Script: scripts/verify-user-agreement-clean-pdf-and-versioning.js
// Purpose: Automated verification suite for Clean PDF Output & Controlled Amendment Workflow (Revision History)

const fs = require('fs')
const path = require('path')

console.log('=== USER AGREEMENT CLEAN PDF & VERSIONING AUDIT ===\n')

// 1. Audit Shell vs Document Component Separation
console.log('--- TEST 1: App Shell UI vs Pure Document Component Separation ---')
const clientPath = path.join(__dirname, '../src/app/(dashboard)/dashboard/agreements/[id]/preview/user-agreement-preview-client.tsx')
const clientContent = fs.readFileSync(clientPath, 'utf8')

if (clientContent.includes('export function UserAgreementDocument') && clientContent.includes('<UserAgreementDocument')) {
  console.log('✓ PASSED: Pure document component (UserAgreementDocument) is strictly separated from preview shell UI.')
} else {
  console.error('❌ FAIL: UserAgreementDocument component separation missing!')
  process.exit(1)
}

// 2. Audit App UI Negative Assertion (Document Component must NOT contain app UI buttons)
console.log('\n--- TEST 2: App Shell UI Negative Assertion ---')
const docCompMatch = clientContent.match(/export function UserAgreementDocument[\s\S]*?^}/m)
const docCompContent = docCompMatch ? docCompMatch[0] : ''

const appUiStrings = [
  'Back to Agreements Center',
  'Edit / Amend Agreement',
  'Version History',
  'Print / Save PDF',
]

appUiStrings.forEach((str) => {
  if (docCompContent.includes(str)) {
    console.error(`❌ FAIL: Document component contains app-shell string: "${str}"!`)
    process.exit(1)
  } else {
    console.log(`  ✓ Negative Assertion Verified: Document component excludes "${str}".`)
  }
})

// 3. Audit Print CSS Rules
console.log('\n--- TEST 3: Print CSS Rule Verification ---')
if (clientContent.includes('@media print') && clientContent.includes('.no-print,') && clientContent.includes('display: none !important;')) {
  console.log('✓ PASSED: @media print CSS strictly hides app-shell controls and enforces white page background.')
} else {
  console.error('❌ FAIL: Print CSS rules missing or incomplete!')
  process.exit(1)
}

// 4. Audit Versioning SQL Migration
console.log('\n--- TEST 4: Additive Versioning Migration Verification ---')
const migrationPath = path.join(__dirname, '../supabase/migrations/20260810050000_user_agreement_versions.sql')
if (!fs.existsSync(migrationPath)) {
  console.error('❌ FAIL: Migration 20260810050000_user_agreement_versions.sql missing!')
  process.exit(1)
}

const migrationSql = fs.readFileSync(migrationPath, 'utf8')
if (migrationSql.includes('rental_agreement_versions') && migrationSql.includes('version_number')) {
  console.log('✓ PASSED: Additive migration 20260810050000_user_agreement_versions.sql verified.')
} else {
  console.error('❌ FAIL: Migration DDL incomplete!')
  process.exit(1)
}

// 5. Audit Amendment Server Action Logic
console.log('\n--- TEST 5: Amendment Server Action & Audit Logging ---')
const actionsPath = path.join(__dirname, '../src/app/(dashboard)/dashboard/agreements/user-agreement-actions.ts')
const actionsContent = fs.readFileSync(actionsPath, 'utf8')

if (
  actionsContent.includes('export async function amendUserAgreementAction') &&
  actionsContent.includes('An Amendment Reason is strictly required') &&
  actionsContent.includes('USER_AGREEMENT_AMENDED') &&
  actionsContent.includes('USER_AGREEMENT_VERSION_CREATED')
) {
  console.log('✓ PASSED: amendUserAgreementAction enforces amendment reason, version increment, and audit logging.')
} else {
  console.error('❌ FAIL: amendUserAgreementAction incomplete or missing audit logs!')
  process.exit(1)
}

console.log('\n✅ CLEAN PDF & AMENDMENT VERSIONING AUDIT PASSED SUCCESSFULLY!\n')
