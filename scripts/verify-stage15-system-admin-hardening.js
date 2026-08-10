// Script: scripts/verify-stage15-system-admin-hardening.js
// Purpose: Automated verification suite for Stage 15 System Administration & Production Hardening

const fs = require('fs')
const path = require('path')

console.log('=== STAGE 15 SYSTEM ADMINISTRATION & HARDENING VERIFICATION SUITE ===\n')

// 1. Audit Migration File
const migrationPath = path.join(__dirname, '../supabase/migrations/20260810020000_system_admin_production_hardening.sql')
if (!fs.existsSync(migrationPath)) {
  console.error('❌ FAIL: 20260810020000_system_admin_production_hardening.sql migration missing!')
  process.exit(1)
}

const migrationSql = fs.readFileSync(migrationPath, 'utf8')
console.log('✓ Found 20260810020000_system_admin_production_hardening.sql (Size:', migrationSql.length, 'bytes)')

const requiredTables = [
  'role_permissions',
  'system_settings',
]

requiredTables.forEach((tbl) => {
  if (migrationSql.includes(tbl)) {
    console.log(`  ✓ DDL table verified: public.${tbl}`)
  } else {
    console.error(`  ❌ Missing DDL table: public.${tbl}`)
    process.exit(1)
  }
})

// 2. Audit Admin Service & Actions
console.log('\n=== Auditing Admin Service Layer & Server Actions ===')

const servicePath = path.join(__dirname, '../src/lib/admin/admin-service.ts')
const actionsPath = path.join(__dirname, '../src/app/(dashboard)/dashboard/settings/settings-actions.ts')

if (!fs.existsSync(servicePath) || !fs.existsSync(actionsPath)) {
  console.error('❌ FAIL: admin-service.ts or settings-actions.ts missing!')
  process.exit(1)
}

const serviceContent = fs.readFileSync(servicePath, 'utf8')
const actionsContent = fs.readFileSync(actionsPath, 'utf8')

if (serviceContent.includes('getSystemSettings')) {
  console.log('  ✓ Service helper verified: getSystemSettings()')
} else {
  console.error('  ❌ Missing service helper: getSystemSettings()')
  process.exit(1)
}

const requiredActions = ['updateSystemSettingsAction', 'updateRolePermissionsAction']
requiredActions.forEach((fn) => {
  if (actionsContent.includes(fn)) {
    console.log(`  ✓ Server action verified: ${fn}()`)
  } else {
    console.error(`  ❌ Missing server action: ${fn}()`)
    process.exit(1)
  }
})

// 3. Audit UI Pages
console.log('\n=== Auditing UI Admin & Hardening Pages ===')

const requiredPages = [
  'src/app/(dashboard)/dashboard/settings/page.tsx',
  'src/app/(dashboard)/dashboard/users/page.tsx',
  'src/app/(dashboard)/dashboard/audit-logs/page.tsx',
  'src/app/(dashboard)/dashboard/go-live-reset/page.tsx',
]

requiredPages.forEach((p) => {
  const fullPath = path.join(__dirname, '..', p)
  if (fs.existsSync(fullPath)) {
    console.log(`  ✓ Verified page: ${p}`)
  } else {
    console.error(`  ❌ Missing page: ${p}`)
    process.exit(1)
  }
})

console.log('\n✅ STAGE 15 SYSTEM ADMINISTRATION & HARDENING VERIFICATION PASSED SUCCESSFULLY!\n')
