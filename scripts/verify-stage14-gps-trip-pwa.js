// Script: scripts/verify-stage14-gps-trip-pwa.js
// Purpose: Automated verification suite for Stage 14 Live GPS, Trip Operations & PWA Mobile

const fs = require('fs')
const path = require('path')

console.log('=== STAGE 14 LIVE GPS, TRIP OPERATIONS & PWA VERIFICATION SUITE ===\n')

// 1. Audit Migration File
const migrationPath = path.join(__dirname, '../supabase/migrations/20260810010000_live_gps_trip_operations.sql')
if (!fs.existsSync(migrationPath)) {
  console.error('❌ FAIL: 20260810010000_live_gps_trip_operations.sql migration missing!')
  process.exit(1)
}

const migrationSql = fs.readFileSync(migrationPath, 'utf8')
console.log('✓ Found 20260810010000_live_gps_trip_operations.sql (Size:', migrationSql.length, 'bytes)')

const requiredTables = [
  'vehicle_gps_locations',
  'vehicle_geofences',
  'trip_tracking_logs',
]

requiredTables.forEach((tbl) => {
  if (migrationSql.includes(tbl)) {
    console.log(`  ✓ DDL table verified: public.${tbl}`)
  } else {
    console.error(`  ❌ Missing DDL table: public.${tbl}`)
    process.exit(1)
  }
})

// 2. Audit GPS Service & Server Actions
console.log('\n=== Auditing GPS Service & Server Actions ===')

const servicePath = path.join(__dirname, '../src/lib/fleet/gps-service.ts')
const actionsPath = path.join(__dirname, '../src/app/(dashboard)/dashboard/fleet/gps/gps-actions.ts')

if (!fs.existsSync(servicePath) || !fs.existsSync(actionsPath)) {
  console.error('❌ FAIL: gps-service.ts or gps-actions.ts missing!')
  process.exit(1)
}

const serviceContent = fs.readFileSync(servicePath, 'utf8')
const actionsContent = fs.readFileSync(actionsPath, 'utf8')

if (serviceContent.includes('getLiveFleetGPSLocations')) {
  console.log('  ✓ Service helper verified: getLiveFleetGPSLocations()')
} else {
  console.error('  ❌ Missing service helper: getLiveFleetGPSLocations()')
  process.exit(1)
}

const requiredActions = ['recordGPSLocationAction', 'recordTripEventAction']
requiredActions.forEach((fn) => {
  if (actionsContent.includes(fn)) {
    console.log(`  ✓ Server action verified: ${fn}()`)
  } else {
    console.error(`  ❌ Missing server action: ${fn}()`)
    process.exit(1)
  }
})

// 3. Audit UI Page, Client Component & PWA Manifest
console.log('\n=== Auditing UI Pages, Client Components & PWA Manifest ===')

const requiredFiles = [
  'src/app/(dashboard)/dashboard/fleet/gps/page.tsx',
  'src/app/(dashboard)/dashboard/fleet/gps/gps-client-wrapper.tsx',
  'public/manifest.json',
]

requiredFiles.forEach((p) => {
  const fullPath = path.join(__dirname, '..', p)
  if (fs.existsSync(fullPath)) {
    console.log(`  ✓ Verified file: ${p}`)
  } else {
    console.error(`  ❌ Missing file: ${p}`)
    process.exit(1)
  }
})

console.log('\n✅ STAGE 14 LIVE GPS, TRIP OPERATIONS & PWA VERIFICATION PASSED SUCCESSFULLY!\n')
