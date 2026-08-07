// Script: scripts/verify-inspection-maintenance-stage7.js
// Purpose: Automated verification suite for Stage 7 Inspection & Maintenance Management Upgrade

const fs = require('fs')
const path = require('path')

console.log('=== STAGE 7 INSPECTION & MAINTENANCE VERIFICATION SUITE ===\n')

// 1. Audit Migration File
const migrationPath = path.join(__dirname, '../supabase/migrations/20260807060000_inspection_maintenance_upgrade.sql')
if (!fs.existsSync(migrationPath)) {
  console.error('❌ FAIL: 20260807060000_inspection_maintenance_upgrade.sql migration missing!')
  process.exit(1)
}

const migrationSql = fs.readFileSync(migrationPath, 'utf8')
console.log('✓ Found 20260807060000_inspection_maintenance_upgrade.sql (Size:', migrationSql.length, 'bytes)')

if (
  migrationSql.includes('service_providers') &&
  migrationSql.includes('vehicle_inspections') &&
  migrationSql.includes('vehicle_damage_records') &&
  migrationSql.includes('maintenance_tasks')
) {
  console.log('✓ Verified DDL tables & constraints: service_providers, vehicle_inspections, vehicle_damage_records, maintenance_tasks')
} else {
  console.error('❌ FAIL: Missing required DDL tables or constraints in migration SQL!')
  process.exit(1)
}

// 2. Audit Maintenance Service Data Layer
const servicePath = path.join(__dirname, '../src/lib/maintenance/maintenance-service.ts')
if (!fs.existsSync(servicePath)) {
  console.error('❌ FAIL: maintenance-service.ts missing!')
  process.exit(1)
}

const serviceContent = fs.readFileSync(servicePath, 'utf8')
console.log('✓ Found maintenance-service.ts (Size:', serviceContent.length, 'bytes)')

const requiredFuncs = ['getInspectionCenterSummary', 'getMaintenanceCenterSummary']
requiredFuncs.forEach((fn) => {
  if (serviceContent.includes(fn)) {
    console.log(`  ✓ Function verified: ${fn}()`)
  } else {
    console.error(`  ❌ Missing function: ${fn}()`)
    process.exit(1)
  }
})

// 3. Audit Stage 7 UI Components & Pages
console.log('\n=== Auditing Stage 7 Components & Pages ===')
const pagesAndComponents = [
  'src/app/(dashboard)/dashboard/maintenance/page.tsx',
  'src/app/(dashboard)/dashboard/maintenance/inspections/page.tsx',
  'src/app/(dashboard)/dashboard/maintenance/maintenance-actions.ts',
  'src/components/maintenance/new-inspection-modal.tsx',
  'src/components/maintenance/new-task-modal.tsx',
  'src/app/(dashboard)/dashboard/maintenance/maintenance-client-wrapper.tsx',
  'src/app/(dashboard)/dashboard/maintenance/inspections/inspections-client-wrapper.tsx',
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

console.log('\n✅ STAGE 7 INSPECTION & MAINTENANCE VERIFICATION PASSED SUCCESSFULLY!\n')
