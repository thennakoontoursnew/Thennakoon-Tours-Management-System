// Script: scripts/verify-marketing-stage10.js
// Purpose: Automated verification suite for Stage 10 Marketing Management Upgrade

const fs = require('fs')
const path = require('path')

console.log('=== STAGE 10 MARKETING MANAGEMENT VERIFICATION SUITE ===\n')

// 1. Audit Migration File
const migrationPath = path.join(__dirname, '../supabase/migrations/20260807090000_marketing_management_upgrade.sql')
if (!fs.existsSync(migrationPath)) {
  console.error('❌ FAIL: 20260807090000_marketing_management_upgrade.sql migration missing!')
  process.exit(1)
}

const migrationSql = fs.readFileSync(migrationPath, 'utf8')
console.log('✓ Found 20260807090000_marketing_management_upgrade.sql (Size:', migrationSql.length, 'bytes)')

const requiredTables = [
  'marketing_campaigns',
  'marketing_offers',
  'marketing_content',
  'marketing_assets',
  'social_accounts',
  'social_metric_snapshots',
  'social_content_metrics',
]

requiredTables.forEach((tbl) => {
  if (migrationSql.includes(tbl)) {
    console.log(`  ✓ Table DDL verified: ${tbl}`)
  } else {
    console.error(`  ❌ Missing table DDL: ${tbl}`)
    process.exit(1)
  }
})

// 2. Audit Marketing Service Data Layer
const servicePath = path.join(__dirname, '../src/lib/marketing/marketing-service.ts')
if (!fs.existsSync(servicePath)) {
  console.error('❌ FAIL: marketing-service.ts missing!')
  process.exit(1)
}

const serviceContent = fs.readFileSync(servicePath, 'utf8')
console.log('✓ Found marketing-service.ts (Size:', serviceContent.length, 'bytes)')

if (serviceContent.includes('getMarketingOverviewSummary')) {
  console.log('  ✓ Function verified: getMarketingOverviewSummary()')
} else {
  console.error('  ❌ Missing function: getMarketingOverviewSummary()')
  process.exit(1)
}

// 3. Audit Stage 10 UI Components & Pages
console.log('\n=== Auditing Stage 10 Components & Pages ===')
const pagesAndComponents = [
  'src/app/(dashboard)/dashboard/marketing/planner/page.tsx',
  'src/app/(dashboard)/dashboard/marketing/calendar/page.tsx',
  'src/app/(dashboard)/dashboard/marketing/campaigns/page.tsx',
  'src/app/(dashboard)/dashboard/marketing/offers/page.tsx',
  'src/app/(dashboard)/dashboard/marketing/library/page.tsx',
  'src/app/(dashboard)/dashboard/marketing/social/page.tsx',
  'src/app/(dashboard)/dashboard/marketing/analytics/page.tsx',
  'src/app/(dashboard)/dashboard/marketing/marketing-actions.ts',
  'src/components/marketing/new-content-modal.tsx',
  'src/components/marketing/new-campaign-modal.tsx',
  'src/components/marketing/new-offer-modal.tsx',
  'src/components/marketing/manual-metric-modal.tsx',
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

console.log('\n✅ STAGE 10 MARKETING MANAGEMENT VERIFICATION PASSED SUCCESSFULLY!\n')
