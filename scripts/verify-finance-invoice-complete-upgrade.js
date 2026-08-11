const fs = require('fs')
const path = require('path')

async function runVerification() {
  console.log('====================================================')
  console.log('🚀 FINANCE & INVOICE MANAGEMENT UPGRADE VERIFICATION')
  console.log('====================================================\n')

  let passedTests = 0
  let totalTests = 0

  function assert(condition, message) {
    totalTests++
    if (condition) {
      console.log(`  ✅ PASS: ${message}`)
      passedTests++
    } else {
      console.error(`  ❌ FAIL: ${message}`)
    }
  }

  try {
    // 1. NAVIGATION ARCHITECTURE VERIFICATION
    console.log('--- 1. NAVIGATION ARCHITECTURE AUDIT ---')
    const navContent = fs.readFileSync(path.join(__dirname, '../src/lib/navigation/navigation-config.ts'), 'utf8')
    assert(navContent.includes("id: 'finance'"), 'Finance section present in navigation config')
    assert(navContent.includes('/dashboard/finance'), 'Contains /dashboard/finance route')
    assert(navContent.includes('/dashboard/reports/earnings'), 'Contains /dashboard/reports/earnings route')
    assert(navContent.includes('/dashboard/expenses'), 'Contains /dashboard/expenses route')
    assert(navContent.includes('/dashboard/invoices'), 'Contains /dashboard/invoices route')
    assert(navContent.includes('/dashboard/payments'), 'Contains /dashboard/payments route')
    assert(navContent.includes('/dashboard/receipts'), 'Contains /dashboard/receipts route')
    assert(navContent.includes('/dashboard/finance/reports'), 'Contains /dashboard/finance/reports route')

    // 2. AUTHORITATIVE DATA LAYER & FORMULAS
    console.log('\n--- 2. CANONICAL FINANCE SERVICE & FORMULAS ---')
    const financeServiceContent = fs.readFileSync(path.join(__dirname, '../src/lib/finance/finance-service.ts'), 'utf8')
    assert(financeServiceContent.includes('getFinanceSummaryKPIs'), 'getFinanceSummaryKPIs defined in finance service')
    assert(financeServiceContent.includes('getPaymentMethodBreakdown'), 'getPaymentMethodBreakdown defined')
    assert(financeServiceContent.includes('getCustomerStatementLedger'), 'getCustomerStatementLedger defined')
    assert(financeServiceContent.includes('getAccountsReceivableAging'), 'getAccountsReceivableAging defined')

    // 3. FILE SYSTEM & MODULE CONTRACTS AUDIT
    console.log('\n--- 3. FINANCE & INVOICE MODULE FILE CONTRACTS ---')
    assert(fs.existsSync(path.join(__dirname, '../src/app/(dashboard)/dashboard/finance/page.tsx')), 'Finance Dashboard page exists')
    assert(fs.existsSync(path.join(__dirname, '../src/app/(dashboard)/dashboard/finance/reports/page.tsx')), 'Finance Reports & Statements page exists')
    assert(fs.existsSync(path.join(__dirname, '../src/app/(dashboard)/dashboard/invoices/page.tsx')), 'Invoice History page exists')
    assert(fs.existsSync(path.join(__dirname, '../src/app/(dashboard)/dashboard/invoices/new/page.tsx')), 'New Invoice page exists')
    assert(fs.existsSync(path.join(__dirname, '../src/app/(dashboard)/dashboard/payments/page.tsx')), 'Payments page exists')
    assert(fs.existsSync(path.join(__dirname, '../src/app/(dashboard)/dashboard/receipts/page.tsx')), 'Receipts page exists')
    assert(fs.existsSync(path.join(__dirname, '../src/lib/documents/invoice-pdf-commercial.ts')), 'Commercial A4 Invoice PDF generator exists')
    assert(fs.existsSync(path.join(__dirname, '../src/lib/documents/customer-statement-pdf.ts')), 'A4 Customer Statement PDF generator exists')

    // 4. USER AGREEMENT V1 INTEGRITY RE-VERIFICATION
    console.log('\n--- 4. USER AGREEMENT V1 TEMPLATE INTEGRITY RE-CHECK ---')
    const userAgreementTemplatePath = path.join(__dirname, '../src/lib/agreements/templates/user-agreement-v1.ts')
    assert(fs.existsSync(userAgreementTemplatePath), 'USER_AGREEMENT_V1 template file exists')

    const userAgreementContent = fs.readFileSync(userAgreementTemplatePath, 'utf8')
    assert(userAgreementContent.includes('Head of Operations Ms. Rashanthi Gunasekara: +94777273820'), 'Clause 18 Rashanthi contact preserved')
    assert(userAgreementContent.includes('Accounts and Finance :+94760080155'), 'Clause 18 Accounts contact preserved')
    assert(userAgreementContent.includes('PV 00312253'), 'Company registration PV 00312253 preserved')

    console.log('\n====================================================')
    console.log(`SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED!`)
    console.log('====================================================')

    if (passedTests === totalTests) {
      process.exit(0)
    } else {
      process.exit(1)
    }
  } catch (err) {
    console.error('❌ EXCEPTION DURING VERIFICATION:', err)
    process.exit(1)
  }
}

runVerification()
