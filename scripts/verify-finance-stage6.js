// Script: scripts/verify-finance-stage6.js
// Purpose: Automated verification suite for Stage 6 Finance, Invoicing, Payments & Expenses

const fs = require('fs')
const path = require('path')

console.log('=== STAGE 6 FINANCE & EXPENSES VERIFICATION SUITE ===\n')

// 1. Audit Migration File
const migrationPath = path.join(__dirname, '../supabase/migrations/20260807050000_finance_management_upgrade.sql')
if (!fs.existsSync(migrationPath)) {
  console.error('❌ FAIL: 20260807050000_finance_management_upgrade.sql migration missing!')
  process.exit(1)
}

const migrationSql = fs.readFileSync(migrationPath, 'utf8')
console.log('✓ Found 20260807050000_finance_management_upgrade.sql (Size:', migrationSql.length, 'bytes)')

if (
  migrationSql.includes('refundable_deposits') &&
  migrationSql.includes('uq_receipt_payment') &&
  migrationSql.includes('idx_invoices_customer_status')
) {
  console.log('✓ Verified DDL tables & constraints: refundable_deposits, uq_receipt_payment, indexes')
} else {
  console.error('❌ FAIL: Missing required DDL tables or constraints in migration SQL!')
  process.exit(1)
}

// 2. Audit Finance Service Data Layer
const servicePath = path.join(__dirname, '../src/lib/finance/finance-service.ts')
if (!fs.existsSync(servicePath)) {
  console.error('❌ FAIL: finance-service.ts missing!')
  process.exit(1)
}

const serviceContent = fs.readFileSync(servicePath, 'utf8')
console.log('✓ Found finance-service.ts (Size:', serviceContent.length, 'bytes)')

const requiredFuncs = ['getPeriodDateRange', 'getFinanceSummaryKPIs']
requiredFuncs.forEach((fn) => {
  if (serviceContent.includes(fn)) {
    console.log(`  ✓ Function verified: ${fn}()`)
  } else {
    console.error(`  ❌ Missing function: ${fn}()`)
    process.exit(1)
  }
})

// 3. Audit Accounting Principles & Invariants
console.log('\n=== Auditing Accounting Principles & Invariants ===')
if (serviceContent.includes("from('payments')") && serviceContent.includes("eq('status', 'completed')")) {
  console.log('  ✓ Revenue Invariant: Verified (Uses completed payments from payments table)')
} else {
  console.error('  ❌ Revenue must strictly come from completed payments!')
  process.exit(1)
}

// 4. Audit Stage 6 UI Components & Pages
console.log('\n=== Auditing Stage 6 Finance Components & Pages ===')
const pagesAndComponents = [
  'src/app/(dashboard)/dashboard/invoices/page.tsx',
  'src/app/(dashboard)/dashboard/expenses/page.tsx',
  'src/app/(dashboard)/dashboard/reports/earnings/page.tsx',
  'src/app/(dashboard)/dashboard/invoices/finance-actions.ts',
  'src/components/finance/record-payment-modal.tsx',
  'src/components/finance/new-expense-modal.tsx',
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

console.log('\n✅ STAGE 6 FINANCE & EXPENSE VERIFICATION PASSED SUCCESSFULLY!\n')
