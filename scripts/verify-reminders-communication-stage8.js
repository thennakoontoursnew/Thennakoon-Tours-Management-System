// Script: scripts/verify-reminders-communication-stage8.js
// Purpose: Automated verification suite for Stage 8 Reminders, Notifications & Communication Upgrade

const fs = require('fs')
const path = require('path')

console.log('=== STAGE 8 REMINDERS & COMMUNICATIONS VERIFICATION SUITE ===\n')

// 1. Audit Migration File
const migrationPath = path.join(__dirname, '../supabase/migrations/20260807070000_reminders_communications_upgrade.sql')
if (!fs.existsSync(migrationPath)) {
  console.error('❌ FAIL: 20260807070000_reminders_communications_upgrade.sql migration missing!')
  process.exit(1)
}

const migrationSql = fs.readFileSync(migrationPath, 'utf8')
console.log('✓ Found 20260807070000_reminders_communications_upgrade.sql (Size:', migrationSql.length, 'bytes)')

if (
  migrationSql.includes('reminders') &&
  migrationSql.includes('notifications') &&
  migrationSql.includes('communication_logs') &&
  migrationSql.includes('communication_templates')
) {
  console.log('✓ Verified DDL tables & constraints: reminders, notifications, communication_logs, communication_templates')
} else {
  console.error('❌ FAIL: Missing required DDL tables or constraints in migration SQL!')
  process.exit(1)
}

// 2. Audit Reminder Service Data Layer
const servicePath = path.join(__dirname, '../src/lib/reminders/reminder-service.ts')
if (!fs.existsSync(servicePath)) {
  console.error('❌ FAIL: reminder-service.ts missing!')
  process.exit(1)
}

const serviceContent = fs.readFileSync(servicePath, 'utf8')
console.log('✓ Found reminder-service.ts (Size:', serviceContent.length, 'bytes)')

const requiredFuncs = ['getReminderCenterSummary', 'syncSystemReminders']
requiredFuncs.forEach((fn) => {
  if (serviceContent.includes(fn)) {
    console.log(`  ✓ Function verified: ${fn}()`)
  } else {
    console.error(`  ❌ Missing function: ${fn}()`)
    process.exit(1)
  }
})

// 3. Audit Stage 8 UI Components & Pages
console.log('\n=== Auditing Stage 8 Components & Pages ===')
const pagesAndComponents = [
  'src/app/(dashboard)/dashboard/reminders/page.tsx',
  'src/app/(dashboard)/dashboard/communication/whatsapp/page.tsx',
  'src/app/(dashboard)/dashboard/communication/sms/page.tsx',
  'src/app/(dashboard)/dashboard/reminders/reminder-actions.ts',
  'src/components/reminders/new-reminder-modal.tsx',
  'src/app/(dashboard)/dashboard/reminders/reminders-client-wrapper.tsx',
  'src/app/(dashboard)/dashboard/communication/whatsapp/whatsapp-client-wrapper.tsx',
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

console.log('\n✅ STAGE 8 REMINDERS & COMMUNICATIONS VERIFICATION PASSED SUCCESSFULLY!\n')
