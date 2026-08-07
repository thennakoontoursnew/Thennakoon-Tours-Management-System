// Script: scripts/verify-customer-crm-stage4.js
// Purpose: Automated verification suite for Stage 4 Customer & CRM Management

const fs = require('fs')
const path = require('path')

console.log('=== STAGE 4 CUSTOMER & CRM MANAGEMENT VERIFICATION SUITE ===\n')

// 1. Audit Migration File
const migrationPath = path.join(__dirname, '../supabase/migrations/20260807030000_customer_crm_upgrade.sql')
if (!fs.existsSync(migrationPath)) {
  console.error('❌ FAIL: 20260807030000_customer_crm_upgrade.sql migration missing!')
  process.exit(1)
}

const migrationSql = fs.readFileSync(migrationPath, 'utf8')
console.log('✓ Found 20260807030000_customer_crm_upgrade.sql (Size:', migrationSql.length, 'bytes)')

if (
  migrationSql.includes('generate_lead_number') &&
  migrationSql.includes('customer_documents') &&
  migrationSql.includes('customer_notes') &&
  migrationSql.includes('crm_leads')
) {
  console.log('✓ Verified DDL tables & functions: generate_lead_number, customer_documents, customer_notes, crm_leads')
} else {
  console.error('❌ FAIL: Missing required DDL tables or functions in migration SQL!')
  process.exit(1)
}

// 2. Audit CRM Service Data Layer
const servicePath = path.join(__dirname, '../src/lib/crm/crm-service.ts')
if (!fs.existsSync(servicePath)) {
  console.error('❌ FAIL: crm-service.ts missing!')
  process.exit(1)
}

const serviceContent = fs.readFileSync(servicePath, 'utf8')
console.log('✓ Found crm-service.ts (Size:', serviceContent.length, 'bytes)')

const requiredFuncs = ['normalizePhone', 'checkDuplicateCustomer', 'getCustomerSummaryKPIs', 'getCustomer360Profile', 'getLeadPipelineKPIs']
requiredFuncs.forEach((fn) => {
  if (serviceContent.includes(fn)) {
    console.log(`  ✓ Function verified: ${fn}()`)
  } else {
    console.error(`  ❌ Missing function: ${fn}()`)
    process.exit(1)
  }
})

// 3. Audit Stage 4 UI Components & Pages
console.log('\n=== Auditing Stage 4 CRM Components & Pages ===')
const pagesAndComponents = [
  'src/app/(dashboard)/dashboard/customers/page.tsx',
  'src/app/(dashboard)/dashboard/customers/[id]/page.tsx',
  'src/app/(dashboard)/dashboard/leads/page.tsx',
  'src/components/crm/customer-profile-tabs.tsx',
  'src/components/crm/customer-note-modal.tsx',
  'src/components/crm/customer-document-modal.tsx',
  'src/components/crm/new-lead-modal.tsx',
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

console.log('\n✅ STAGE 4 CUSTOMER & CRM VERIFICATION PASSED SUCCESSFULLY!\n')
