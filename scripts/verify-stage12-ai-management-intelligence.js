// Script: scripts/verify-stage12-ai-management-intelligence.js
// Purpose: Automated verification suite for Stage 12 AI Reports, Management Intelligence & Revenue Forecasting

const fs = require('fs')
const path = require('path')

console.log('=== STAGE 12 AI MANAGEMENT INTELLIGENCE & FORECASTING VERIFICATION SUITE ===\n')

// 1. Audit Migration File
const migrationPath = path.join(__dirname, '../supabase/migrations/20260807120000_ai_management_intelligence.sql')
if (!fs.existsSync(migrationPath)) {
  console.error('❌ FAIL: 20260807120000_ai_management_intelligence.sql migration missing!')
  process.exit(1)
}

const migrationSql = fs.readFileSync(migrationPath, 'utf8')
console.log('✓ Found 20260807120000_ai_management_intelligence.sql (Size:', migrationSql.length, 'bytes)')

const requiredTables = [
  'ai_generated_reports',
  'ai_insights',
  'ai_forecasts',
  'ai_query_logs',
]

requiredTables.forEach((tbl) => {
  if (migrationSql.includes(tbl)) {
    console.log(`  ✓ DDL table verified: public.${tbl}`)
  } else {
    console.error(`  ❌ Missing DDL table: public.${tbl}`)
    process.exit(1)
  }
})

const requiredFunctions = [
  'generate_next_ai_report_number',
  'generate_next_ai_insight_number',
  'generate_next_ai_forecast_number',
]

requiredFunctions.forEach((fn) => {
  if (migrationSql.includes(fn)) {
    console.log(`  ✓ Sequence Generator verified: ${fn}()`)
  } else {
    console.error(`  ❌ Missing Sequence Generator: ${fn}()`)
    process.exit(1)
  }
})

// 2. Audit AI Core Library Layer
console.log('\n=== Auditing AI Library Layer ===')

const aiFiles = [
  'src/lib/ai/ai-types.ts',
  'src/lib/ai/ai-context-builder.ts',
  'src/lib/ai/ai-prompts.ts',
  'src/lib/ai/ai-response-validator.ts',
  'src/lib/ai/ai-provider.ts',
  'src/lib/ai/ai-forecast-service.ts',
  'src/lib/ai/management-intelligence-service.ts',
  'src/lib/ai/ai-service.ts',
]

aiFiles.forEach((fileRel) => {
  const fullPath = path.join(__dirname, '..', fileRel)
  if (fs.existsSync(fullPath)) {
    console.log(`  ✓ Verified AI file: ${fileRel}`)
  } else {
    console.error(`  ❌ Missing AI file: ${fileRel}`)
    process.exit(1)
  }
})

// 3. Audit UI Components & Pages
console.log('\n=== Auditing UI Pages & Components ===')

const uiFiles = [
  'src/app/(dashboard)/dashboard/ai-tools/page.tsx',
  'src/app/(dashboard)/dashboard/ai-tools/ai-actions.ts',
  'src/app/(dashboard)/dashboard/ai-tools/ai-tools-client.tsx',
  'src/components/ai/ai-executive-brief.tsx',
  'src/components/ai/ai-insights-center.tsx',
  'src/components/ai/forecast-dashboard.tsx',
  'src/components/ai/ask-management-ai.tsx',
  'src/components/ai/generated-report-history.tsx',
  'src/components/dashboard/management-intelligence-widget.tsx',
]

uiFiles.forEach((fileRel) => {
  const fullPath = path.join(__dirname, '..', fileRel)
  if (fs.existsSync(fullPath)) {
    console.log(`  ✓ Verified UI component: ${fileRel}`)
  } else {
    console.error(`  ❌ Missing UI component: ${fileRel}`)
    process.exit(1)
  }
})

console.log('\n✅ STAGE 12 AI MANAGEMENT INTELLIGENCE & FORECASTING VERIFICATION PASSED SUCCESSFULLY!\n')
