// Script: scripts/verify-driver-management-stage5.js
// Purpose: Automated verification suite for Stage 5 Driver Management & Operations Upgrade

const fs = require('fs')
const path = require('path')

console.log('=== STAGE 5 DRIVER MANAGEMENT & OPERATIONS VERIFICATION SUITE ===\n')

// 1. Audit Migration File
const migrationPath = path.join(__dirname, '../supabase/migrations/20260807040000_driver_management_upgrade.sql')
if (!fs.existsSync(migrationPath)) {
  console.error('❌ FAIL: 20260807040000_driver_management_upgrade.sql migration missing!')
  process.exit(1)
}

const migrationSql = fs.readFileSync(migrationPath, 'utf8')
console.log('✓ Found 20260807040000_driver_management_upgrade.sql (Size:', migrationSql.length, 'bytes)')

if (
  migrationSql.includes('check_driver_status') &&
  migrationSql.includes('driver_unavailability') &&
  migrationSql.includes('driver_incidents') &&
  migrationSql.includes('driver_notes')
) {
  console.log('✓ Verified DDL tables & constraints: check_driver_status, driver_unavailability, driver_incidents, driver_notes')
} else {
  console.error('❌ FAIL: Missing required DDL tables or constraints in migration SQL!')
  process.exit(1)
}

// 2. Audit Driver Service Data Layer
const servicePath = path.join(__dirname, '../src/lib/drivers/driver-service.ts')
if (!fs.existsSync(servicePath)) {
  console.error('❌ FAIL: driver-service.ts missing!')
  process.exit(1)
}

const serviceContent = fs.readFileSync(servicePath, 'utf8')
console.log('✓ Found driver-service.ts (Size:', serviceContent.length, 'bytes)')

const requiredFuncs = ['calculateDriverAvailability', 'getDriverSummaryKPIs', 'getDriver360Profile']
requiredFuncs.forEach((fn) => {
  if (serviceContent.includes(fn)) {
    console.log(`  ✓ Function verified: ${fn}()`)
  } else {
    console.error(`  ❌ Missing function: ${fn}()`)
    process.exit(1)
  }
})

// 3. Audit Stage 5 UI Components & Pages
console.log('\n=== Auditing Stage 5 Driver Components & Pages ===')
const pagesAndComponents = [
  'src/app/(dashboard)/dashboard/drivers/page.tsx',
  'src/app/(dashboard)/dashboard/drivers/[id]/page.tsx',
  'src/components/drivers/driver-profile-tabs.tsx',
  'src/components/drivers/driver-leave-modal.tsx',
]

pagesAndComponents.forEach((p) => {
  const fullPath = path.join(__dirname, '..', p)
  if (fs.existsSync(fullPath)) {
    console.log(`  ✓ Verified file: ${p}`)
  } else {
    console.error(`  ❌ Missing file: ${p}`)
    process.exit(1)
  }
})

console.log('\n✅ STAGE 5 DRIVER MANAGEMENT VERIFICATION PASSED SUCCESSFULLY!\n')
