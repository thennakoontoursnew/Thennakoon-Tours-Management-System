// Script: scripts/verify-stage11-fleet-owners-fuel.js
// Purpose: Automated verification suite for Stage 11 Vehicle Owners, Fuel Tracking, and Advanced Fleet Analytics

const fs = require('fs')
const path = require('path')

console.log('=== STAGE 11 FLEET OWNERS, FUEL & ANALYTICS VERIFICATION SUITE ===\n')

// 1. Audit Migration Files
const migration1Path = path.join(__dirname, '../supabase/migrations/20260807100000_vehicle_owners_fuel_tracking.sql')
const migration2Path = path.join(__dirname, '../supabase/migrations/20260807110000_stage11_completeness_upgrade.sql')

if (!fs.existsSync(migration1Path) || !fs.existsSync(migration2Path)) {
  console.error('❌ FAIL: Stage 11 migration files missing!')
  process.exit(1)
}

const sql1 = fs.readFileSync(migration1Path, 'utf8')
const sql2 = fs.readFileSync(migration2Path, 'utf8')

console.log('✓ Found 20260807100000_vehicle_owners_fuel_tracking.sql (Size:', sql1.length, 'bytes)')
console.log('✓ Found 20260807110000_stage11_completeness_upgrade.sql (Size:', sql2.length, 'bytes)')

// Verify DDL entities across migrations
const requiredTables = [
  'vehicle_owners',
  'owner_payouts',
  'fuel_logs',
  'vehicle_fuel_stats',
  'owner_statements',
  'vehicle_status_history',
]

const combinedSql = sql1 + '\n' + sql2

requiredTables.forEach((tbl) => {
  if (combinedSql.includes(tbl)) {
    console.log(`  ✓ DDL table verified: public.${tbl}`)
  } else {
    console.error(`  ❌ Missing DDL table: public.${tbl}`)
    process.exit(1)
  }
})

// Verify Sequence Generators (OWN-YYYY-XXXXXX, SET-YYYY-XXXXXX, STM-YYYY-XXXXXX)
const requiredFunctions = [
  'generate_next_owner_number',
  'generate_next_owner_number_v2',
  'generate_next_settlement_number_v2',
  'generate_next_statement_number',
]

requiredFunctions.forEach((fn) => {
  if (combinedSql.includes(fn)) {
    console.log(`  ✓ Sequence Generator verified: ${fn}()`)
  } else {
    console.error(`  ❌ Missing Sequence Generator: ${fn}()`)
    process.exit(1)
  }
})

// 2. Audit Domain Service Layer & Calculations
console.log('\n=== Auditing Service Layer & Calculation Helpers ===')

const fleetServicePath = path.join(__dirname, '../src/lib/fleet/fleet-service.ts')
if (!fs.existsSync(fleetServicePath)) {
  console.error('❌ FAIL: fleet-service.ts missing!')
  process.exit(1)
}

const fleetServiceContent = fs.readFileSync(fleetServicePath, 'utf8')
console.log('✓ Found fleet-service.ts (Size:', fleetServiceContent.length, 'bytes)')

const serviceHelpers = [
  'calculateVehicleHealthScore',
  'calculateFuelEfficiency',
  'getFleetSummaryKPIs',
  'getVehicleProfileData',
]

serviceHelpers.forEach((fn) => {
  if (fleetServiceContent.includes(fn)) {
    console.log(`  ✓ Service helper verified: ${fn}()`)
  } else {
    console.error(`  ❌ Missing service helper: ${fn}()`)
    process.exit(1)
  }
})

// 3. Audit Server Actions
console.log('\n=== Auditing Server Actions ===')

const ownerActionsPath = path.join(__dirname, '../src/app/(dashboard)/dashboard/fleet/owners/owner-actions.ts')
const fuelActionsPath = path.join(__dirname, '../src/app/(dashboard)/dashboard/fleet/fuel/fuel-actions.ts')

if (!fs.existsSync(ownerActionsPath) || !fs.existsSync(fuelActionsPath)) {
  console.error('❌ FAIL: owner-actions.ts or fuel-actions.ts missing!')
  process.exit(1)
}

const ownerActions = fs.readFileSync(ownerActionsPath, 'utf8')
const fuelActions = fs.readFileSync(fuelActionsPath, 'utf8')

const requiredActions = [
  { file: 'owner-actions.ts', name: 'createVehicleOwnerAction', content: ownerActions },
  { file: 'owner-actions.ts', name: 'updateVehicleOwnerAction', content: ownerActions },
  { file: 'owner-actions.ts', name: 'createOwnerPayoutAction', content: ownerActions },
  { file: 'owner-actions.ts', name: 'createOwnerStatementAction', content: ownerActions },
  { file: 'fuel-actions.ts', name: 'createFuelLogAction', content: fuelActions },
  { file: 'fuel-actions.ts', name: 'updateFuelLogAction', content: fuelActions },
  { file: 'fuel-actions.ts', name: 'deleteFuelLogAction', content: fuelActions },
]

requiredActions.forEach(({ file, name, content }) => {
  if (content.includes(name)) {
    console.log(`  ✓ Server action verified (${file}): ${name}()`)
  } else {
    console.error(`  ❌ Missing server action in ${file}: ${name}()`)
    process.exit(1)
  }
})

// 4. Audit Stage 11 Pages & Components
console.log('\n=== Auditing Stage 11 UI Pages & Components ===')

const requiredPages = [
  'src/app/(dashboard)/dashboard/fleet/owners/page.tsx',
  'src/app/(dashboard)/dashboard/fleet/owners/vehicle-owners-client.tsx',
  'src/app/(dashboard)/dashboard/fleet/fuel/page.tsx',
  'src/app/(dashboard)/dashboard/fleet/fuel/fuel-tracking-client.tsx',
  'src/app/(dashboard)/dashboard/portals/owner/page.tsx',
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

console.log('\n✅ STAGE 11 FLEET OWNERS, FUEL & ANALYTICS VERIFICATION PASSED SUCCESSFULLY!\n')
