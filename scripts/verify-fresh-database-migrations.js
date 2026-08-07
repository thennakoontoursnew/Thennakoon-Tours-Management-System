// Script: scripts/verify-fresh-database-migrations.js
// Purpose: Simulates fresh database execution across all chronological migrations to ensure zero dependency errors.

const fs = require('fs')
const path = require('path')

console.log('=== FRESH DATABASE MIGRATION DEPENDENCY AUDIT ===\n')

const migrationsDir = path.join(__dirname, '../supabase/migrations')
const files = fs.readdirSync(migrationsDir).sort()

console.log(`Auditing ${files.length} migration files in chronological order:\n`)

const createdTables = new Set()
const tableColumns = new Map() // table -> Set(columns)

let totalErrors = 0

files.forEach((file) => {
  const filePath = path.join(migrationsDir, file)
  const content = fs.readFileSync(filePath, 'utf8')

  // 1. Detect CREATE TABLE statements
  const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?([a-zA-Z0-9_]+)\s*\(([\s\S]*?)\);/gi
  let match
  while ((match = createTableRegex.exec(content)) !== null) {
    const tableName = match[1].toLowerCase()
    createdTables.add(tableName)

    if (!tableColumns.has(tableName)) {
      tableColumns.set(tableName, new Set())
    }

    const body = match[2]
    const lines = body.split('\n')
    lines.forEach((line) => {
      const colMatch = line.trim().match(/^([a-zA-Z0-9_]+)\s+[a-zA-Z]/)
      if (colMatch) {
        const colName = colMatch[1].toLowerCase()
        if (!['primary', 'foreign', 'constraint', 'unique', 'check'].includes(colName)) {
          tableColumns.get(tableName).add(colName)
        }
      }
    })
  }

  // 2. Detect ALTER TABLE statements (excluding IF EXISTS keywords)
  const alterTableRegex = /ALTER\s+TABLE\s+(?:IF\s+EXISTS\s+)?(?:public\.)?([a-zA-Z0-9_]+)\s+/gi
  while ((match = alterTableRegex.exec(content)) !== null) {
    const targetTable = match[1].toLowerCase()
    if (['if', 'only'].includes(targetTable)) continue

    if (!createdTables.has(targetTable)) {
      console.error(`❌ MIGRATION DEPENDENCY ERROR in [${file}]:`)
      console.error(`   ALTER TABLE public.${targetTable} executes before ${targetTable} table is created!`)
      totalErrors++
    }
  }

  // 3. Detect CREATE INDEX statements
  const createIndexRegex = /CREATE\s+INDEX\s+.*?\s+ON\s+(?:public\.)?([a-zA-Z0-9_]+)/gi
  while ((match = createIndexRegex.exec(content)) !== null) {
    const targetTable = match[1].toLowerCase()
    if (!createdTables.has(targetTable)) {
      console.error(`❌ MIGRATION DEPENDENCY ERROR in [${file}]:`)
      console.error(`   CREATE INDEX operates on public.${targetTable} before table is created!`)
      totalErrors++
    }
  }

  // 4. Detect RLS ENABLE / POLICY statements
  const rlsRegex = /POLICY\s+.*?\s+ON\s+(?:public\.)?([a-zA-Z0-9_]+)/gi
  while ((match = rlsRegex.exec(content)) !== null) {
    const targetTable = match[1].toLowerCase()
    if (!createdTables.has(targetTable)) {
      console.error(`❌ MIGRATION DEPENDENCY ERROR in [${file}]:`)
      console.error(`   RLS POLICY targets public.${targetTable} before table is created!`)
      totalErrors++
    }
  }

  console.log(`  ✓ Checked ${file}`)
})

console.log('\n=== Created Tables Summary ===')
console.log(Array.from(createdTables).sort().join(', '))

if (totalErrors === 0) {
  console.log('\n✅ FRESH DATABASE MIGRATION DEPENDENCY AUDIT PASSED WITH 0 ERRORS!\n')
} else {
  console.error(`\n❌ AUDIT FAILED WITH ${totalErrors} DEPENDENCY ERRORS!`)
  process.exit(1)
}
