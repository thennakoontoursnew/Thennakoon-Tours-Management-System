// Script: scripts/verify-agreements-center-upgrade.js
// Purpose: Automated verification suite for Stage 17 / Upgraded Agreements Center (User Agreement & Owner Agreement)

const fs = require('fs')
const path = require('path')

console.log('=== AGREEMENTS CENTER UPGRADE VERIFICATION SUITE ===\n')

// 1. Audit Migration File
const migrationPath = path.join(__dirname, '../supabase/migrations/20260810030000_agreements_center_upgrade.sql')
if (!fs.existsSync(migrationPath)) {
  console.error('❌ FAIL: 20260810030000_agreements_center_upgrade.sql migration missing!')
  process.exit(1)
}

const migrationSql = fs.readFileSync(migrationPath, 'utf8')
console.log('✓ Found 20260810030000_agreements_center_upgrade.sql (Size:', migrationSql.length, 'bytes)')

const requiredTables = [
  'owner_agreements',
  'owner_agreement_vehicles',
]

requiredTables.forEach((tbl) => {
  if (migrationSql.includes(tbl)) {
    console.log(`  ✓ DDL table verified: public.${tbl}`)
  } else {
    console.error(`  ❌ Missing DDL table: public.${tbl}`)
    process.exit(1)
  }
})

if (migrationSql.includes('generate_next_owner_agreement_number')) {
  console.log('  ✓ Sequence Generator verified: generate_next_owner_agreement_number()')
} else {
  console.error('  ❌ Missing Sequence Generator: generate_next_owner_agreement_number()')
  process.exit(1)
}

// 2. Audit Agreement Service & Server Actions
console.log('\n=== Auditing Service Layer & Server Actions ===')

const servicePath = path.join(__dirname, '../src/lib/agreements/agreement-service.ts')
const actionsPath = path.join(__dirname, '../src/app/(dashboard)/dashboard/agreements/agreement-actions.ts')

if (!fs.existsSync(servicePath) || !fs.existsSync(actionsPath)) {
  console.error('❌ FAIL: agreement-service.ts or agreement-actions.ts missing!')
  process.exit(1)
}

const serviceContent = fs.readFileSync(servicePath, 'utf8')
const actionsContent = fs.readFileSync(actionsPath, 'utf8')

const requiredServiceFuncs = ['getAgreementsKPIs', 'getUserAgreements', 'getOwnerAgreements', 'getOwnerAgreementById']
requiredServiceFuncs.forEach((fn) => {
  if (serviceContent.includes(fn)) {
    console.log(`  ✓ Service helper verified: ${fn}()`)
  } else {
    console.error(`  ❌ Missing service helper: ${fn}()`)
    process.exit(1)
  }
})

const requiredActions = ['createAgreementFromBooking', 'createOwnerAgreementAction', 'updateOwnerAgreementStatusAction']
requiredActions.forEach((fn) => {
  if (actionsContent.includes(fn)) {
    console.log(`  ✓ Server action verified: ${fn}()`)
  } else {
    console.error(`  ❌ Missing server action: ${fn}()`)
    process.exit(1)
  }
})

// 3. Audit Exact Official Category Naming Mandate
console.log('\n=== Auditing Official UI Naming Mandate ===')
const clientPath = path.join(__dirname, '../src/app/(dashboard)/dashboard/agreements/agreements-client.tsx')
if (!fs.existsSync(clientPath)) {
  console.error('❌ FAIL: agreements-client.tsx missing!')
  process.exit(1)
}

const clientContent = fs.readFileSync(clientPath, 'utf8')
if (clientContent.includes('User Agreement') && clientContent.includes('Owner Agreement')) {
  console.log('  ✓ UI Naming Mandate verified: "User Agreement" and "Owner Agreement" exact names present.')
} else {
  console.error('  ❌ UI Naming Mandate FAIL: "User Agreement" or "Owner Agreement" not found in UI component.')
  process.exit(1)
}

// 4. Audit UI Pages & Components
console.log('\n=== Auditing UI Pages & PDF Preview Components ===')

const requiredPages = [
  'src/app/(dashboard)/dashboard/agreements/page.tsx',
  'src/app/(dashboard)/dashboard/agreements/agreements-client.tsx',
  'src/app/(dashboard)/dashboard/agreements/owner/[id]/page.tsx',
  'src/app/(dashboard)/dashboard/agreements/owner/[id]/preview/page.tsx',
  'src/components/agreements/new-owner-agreement-modal.tsx',
]

requiredPages.forEach((p) => {
  const fullPath = path.join(__dirname, '..', p)
  if (fs.existsSync(fullPath)) {
    console.log(`  ✓ Verified page/component: ${p}`)
  } else {
    console.error(`  ❌ Missing page/component: ${p}`)
    process.exit(1)
  }
})

// 5. Audit Integrations
console.log('\n=== Auditing Integrations (Reminders, Search & Reports) ===')
const reminderPath = path.join(__dirname, '../src/lib/reminders/reminder-service.ts')
const searchPath = path.join(__dirname, '../src/components/layout/global-search-modal.tsx')
const reportPath = path.join(__dirname, '../src/lib/reports/report-registry.ts')

if (fs.readFileSync(reminderPath, 'utf8').includes('owner_agreement_expiry')) {
  console.log('  ✓ Reminders integration verified: owner_agreement_expiry')
} else {
  console.error('  ❌ Missing reminder integration: owner_agreement_expiry')
  process.exit(1)
}

if (fs.readFileSync(searchPath, 'utf8').includes('User Agreement') && fs.readFileSync(searchPath, 'utf8').includes('Owner Agreement')) {
  console.log('  ✓ Global Search integration verified: User Agreement & Owner Agreement')
} else {
  console.error('  ❌ Missing global search integration for agreements')
  process.exit(1)
}

if (fs.readFileSync(reportPath, 'utf8').includes('user_agreements_report') && fs.readFileSync(reportPath, 'utf8').includes('owner_agreements_report')) {
  console.log('  ✓ Reports Center integration verified: user_agreements_report & owner_agreements_report')
} else {
  console.error('  ❌ Missing reports center integration for agreements')
  process.exit(1)
}

console.log('\n✅ AGREEMENTS CENTER UPGRADE VERIFICATION PASSED SUCCESSFULLY!\n')
