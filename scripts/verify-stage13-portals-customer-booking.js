// Script: scripts/verify-stage13-portals-customer-booking.js
// Purpose: Automated verification suite for Stage 13 Portal Ecosystem & Customer Self-Booking

const fs = require('fs')
const path = require('path')

console.log('=== STAGE 13 PORTAL ECOSYSTEM & CUSTOMER SELF-BOOKING VERIFICATION SUITE ===\n')

// 1. Audit Migration File
const migrationPath = path.join(__dirname, '../supabase/migrations/20260810000000_portal_ecosystem.sql')
if (!fs.existsSync(migrationPath)) {
  console.error('❌ FAIL: 20260810000000_portal_ecosystem.sql migration missing!')
  process.exit(1)
}

const migrationSql = fs.readFileSync(migrationPath, 'utf8')
console.log('✓ Found 20260810000000_portal_ecosystem.sql (Size:', migrationSql.length, 'bytes)')

const requiredTables = [
  'customer_self_bookings',
  'portal_notifications',
]

requiredTables.forEach((tbl) => {
  if (migrationSql.includes(tbl)) {
    console.log(`  ✓ DDL table verified: public.${tbl}`)
  } else {
    console.error(`  ❌ Missing DDL table: public.${tbl}`)
    process.exit(1)
  }
})

if (migrationSql.includes('generate_next_self_booking_number')) {
  console.log('  ✓ Sequence Generator verified: generate_next_self_booking_number()')
} else {
  console.error('  ❌ Missing Sequence Generator: generate_next_self_booking_number()')
  process.exit(1)
}

// 2. Audit Portal Service & Actions
console.log('\n=== Auditing Service Layer & Server Actions ===')

const servicePath = path.join(__dirname, '../src/lib/portals/portal-service.ts')
const actionsPath = path.join(__dirname, '../src/app/(dashboard)/dashboard/portals/portal-actions.ts')

if (!fs.existsSync(servicePath) || !fs.existsSync(actionsPath)) {
  console.error('❌ FAIL: portal-service.ts or portal-actions.ts missing!')
  process.exit(1)
}

const serviceContent = fs.readFileSync(servicePath, 'utf8')
const actionsContent = fs.readFileSync(actionsPath, 'utf8')

const requiredServiceFuncs = ['getCustomerPortalData', 'getDriverPortalData', 'getOwnerPortalData']
requiredServiceFuncs.forEach((fn) => {
  if (serviceContent.includes(fn)) {
    console.log(`  ✓ Service helper verified: ${fn}()`)
  } else {
    console.error(`  ❌ Missing service helper: ${fn}()`)
    process.exit(1)
  }
})

const requiredActions = ['createSelfBookingRequestAction', 'approveSelfBookingRequestAction', 'toggleCustomerPortalAccessAction', 'toggleDriverPortalAccessAction']
requiredActions.forEach((fn) => {
  if (actionsContent.includes(fn)) {
    console.log(`  ✓ Server action verified: ${fn}()`)
  } else {
    console.error(`  ❌ Missing server action: ${fn}()`)
    process.exit(1)
  }
})

// 3. Audit UI Pages & Components
console.log('\n=== Auditing UI Pages & Client Components ===')

const requiredPages = [
  'src/app/(dashboard)/dashboard/portals/customer/page.tsx',
  'src/app/(dashboard)/dashboard/portals/customer/customer-portal-client.tsx',
  'src/app/(dashboard)/dashboard/portals/driver/page.tsx',
  'src/app/(dashboard)/dashboard/portals/driver/driver-portal-client.tsx',
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

console.log('\n✅ STAGE 13 PORTAL ECOSYSTEM & CUSTOMER SELF-BOOKING VERIFICATION PASSED SUCCESSFULLY!\n')
