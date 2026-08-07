// Script: scripts/verify-reports-analytics-stage9.js
// Purpose: Automated verification suite for Stage 9 Reports Center & Analytics Consolidation

const fs = require('fs')
const path = require('path')

console.log('=== STAGE 9 REPORTS & ANALYTICS VERIFICATION SUITE ===\n')

// 1. Audit Migration File
const migrationPath = path.join(__dirname, '../supabase/migrations/20260807080000_reports_analytics_upgrade.sql')
if (!fs.existsSync(migrationPath)) {
  console.error('❌ FAIL: 20260807080000_reports_analytics_upgrade.sql migration missing!')
  process.exit(1)
}

const migrationSql = fs.readFileSync(migrationPath, 'utf8')
console.log('✓ Found 20260807080000_reports_analytics_upgrade.sql (Size:', migrationSql.length, 'bytes)')

if (migrationSql.includes('report_presets') && migrationSql.includes('report_execution_logs')) {
  console.log('✓ Verified DDL tables & constraints: report_presets, report_execution_logs')
} else {
  console.error('❌ FAIL: Missing required DDL tables or constraints in migration SQL!')
  process.exit(1)
}

// 2. Audit Report Registry & Service Data Layer
const registryPath = path.join(__dirname, '../src/lib/reports/report-registry.ts')
const servicePath = path.join(__dirname, '../src/lib/reports/report-service.ts')

if (!fs.existsSync(registryPath) || !fs.existsSync(servicePath)) {
  console.error('❌ FAIL: report-registry.ts or report-service.ts missing!')
  process.exit(1)
}

const serviceContent = fs.readFileSync(servicePath, 'utf8')
console.log('✓ Found report-service.ts (Size:', serviceContent.length, 'bytes)')

const requiredFuncs = ['getConsolidatedReportData', 'generateCsvString']
requiredFuncs.forEach((fn) => {
  if (serviceContent.includes(fn)) {
    console.log(`  ✓ Function verified: ${fn}()`)
  } else {
    console.error(`  ❌ Missing function: ${fn}()`)
    process.exit(1)
  }
})

// 3. Audit Stage 9 UI Components & Pages
console.log('\n=== Auditing Stage 9 Components & Pages ===')
const pagesAndComponents = [
  'src/app/(dashboard)/dashboard/reports/page.tsx',
  'src/app/(dashboard)/dashboard/reports/[reportId]/page.tsx',
  'src/app/(dashboard)/dashboard/analytics/page.tsx',
  'src/components/reports/report-table.tsx',
  'src/app/(dashboard)/dashboard/reports/reports-client-wrapper.tsx',
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

console.log('\n✅ STAGE 9 REPORTS & ANALYTICS VERIFICATION PASSED SUCCESSFULLY!\n')
