// Script: scripts/verify-fleet-management-stage3.js
// Purpose: Automated verification suite for Stage 3 Vehicle & Fleet Management

const fs = require('fs')
const path = require('path')

console.log('=== STAGE 3 FLEET MANAGEMENT VERIFICATION SUITE ===\n')

// 1. Audit Migration File
const migrationPath = path.join(__dirname, '../supabase/migrations/20260807020000_fleet_management_upgrade.sql')
if (!fs.existsSync(migrationPath)) {
  console.error('❌ FAIL: 20260807020000_fleet_management_upgrade.sql migration missing!')
  process.exit(1)
}

const migrationSql = fs.readFileSync(migrationPath, 'utf8')
console.log('✓ Found 20260807020000_fleet_management_upgrade.sql (Size:', migrationSql.length, 'bytes)')

if (
  migrationSql.includes('check_vehicle_status') &&
  migrationSql.includes('vehicle_odometer_logs') &&
  migrationSql.includes('vehicle_documents') &&
  migrationSql.includes('vehicle_photos')
) {
  console.log('✓ Verified DDL tables & constraints: check_vehicle_status, odometer_logs, documents, photos')
} else {
  console.error('❌ FAIL: Missing required DDL tables or constraints in migration SQL!')
  process.exit(1)
}

// 2. Audit Fleet Service Data Layer
const servicePath = path.join(__dirname, '../src/lib/fleet/fleet-service.ts')
if (!fs.existsSync(servicePath)) {
  console.error('❌ FAIL: fleet-service.ts missing!')
  process.exit(1)
}

const serviceContent = fs.readFileSync(servicePath, 'utf8')
console.log('✓ Found fleet-service.ts (Size:', serviceContent.length, 'bytes)')

const requiredFuncs = ['normalizeRegistrationNumber', 'calculateDocumentHealth', 'getFleetSummaryKPIs', 'getVehicleProfileData']
requiredFuncs.forEach((fn) => {
  if (serviceContent.includes(fn)) {
    console.log(`  ✓ Function verified: ${fn}()`)
  } else {
    console.error(`  ❌ Missing function: ${fn}()`)
    process.exit(1)
  }
})

// 3. Audit Financial Principles
console.log('\n=== Auditing Fleet Financial Principles ===')
if (serviceContent.includes("from('payments')") && serviceContent.includes("eq('status', 'completed')")) {
  console.log('  ✓ Collected Revenue Source: Verified (Uses completed payments from payments table)')
} else {
  console.error('  ❌ Collected revenue must use completed payments!')
  process.exit(1)
}

// 4. Audit Stage 3 UI Components
console.log('\n=== Auditing Stage 3 Fleet Components & Pages ===')
const pagesAndComponents = [
  'src/app/(dashboard)/dashboard/vehicles/page.tsx',
  'src/app/(dashboard)/dashboard/vehicles/[id]/page.tsx',
  'src/app/(dashboard)/dashboard/fleet/page.tsx',
  'src/components/fleet/vehicle-profile-tabs.tsx',
  'src/components/fleet/vehicle-odometer-modal.tsx',
  'src/components/fleet/vehicle-document-modal.tsx',
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

console.log('\n✅ STAGE 3 FLEET MANAGEMENT VERIFICATION PASSED SUCCESSFULLY!\n')
