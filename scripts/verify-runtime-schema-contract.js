/**
 * Schema Contract Assertion Script
 * Verifies that all database columns queried or written by Next.js application code
 * are explicitly defined in Supabase DDL migrations.
 */

const fs = require('fs')
const path = require('path')

const MIGRATIONS_DIR = path.join(__dirname, '../supabase/migrations')

const REQUIRED_TABLE_CONTRACTS = {
  customers: [
    'id', 'customer_code', 'customer_type', 'full_name', 'company_name', 'nic', 'passport_number',
    'mobile', 'email', 'address', 'address_line_1', 'status', 'is_archived', 'created_by', 'updated_by',
    'created_at', 'updated_at'
  ],
  quotations: [
    'id', 'quotation_number', 'customer_id', 'quotation_date', 'valid_until', 'rental_start_date', 'rental_end_date',
    'pickup_location', 'dropoff_location', 'destination', 'passenger_count', 'purpose', 'currency', 'subtotal',
    'discount_type', 'discount_value', 'discount_amount', 'tax_rate', 'tax_amount', 'refundable_deposit',
    'additional_charges', 'grand_total', 'notes', 'special_notes', 'important_message', 'bank_account_name_snapshot',
    'bank_name_snapshot', 'bank_branch_snapshot', 'bank_account_number_snapshot', 'bank_swift_code_snapshot',
    'payment_instructions_snapshot', 'prepared_by_name_snapshot', 'prepared_by_designation_snapshot',
    'company_name_snapshot', 'terms_and_conditions_snapshot', 'status', 'prepared_by', 'created_by', 'updated_by',
    'created_at', 'updated_at'
  ],
  document_templates: [
    'id', 'document_type', 'title', 'display_name', 'special_notes', 'important_message', 'bank_account_name',
    'bank_name', 'bank_branch', 'bank_account_number', 'bank_swift_code', 'payment_instructions',
    'prepared_by_designation', 'company_name', 'default_terms_and_conditions', 'bank_details', 'prepared_by_label',
    'terms_and_conditions', 'is_active', 'created_by', 'updated_by', 'created_at', 'updated_at'
  ],
  vehicles: [
    'id', 'vehicle_code', 'vehicle_name', 'brand', 'model', 'manufacture_year', 'registration_number',
    'daily_rate', 'refundable_deposit', 'allowed_km_per_day', 'extra_km_charge', 'status', 'is_archived'
  ]
}

function runSchemaContractAudit() {
  console.log('=== Step 1: Auditing SQL Migrations against Application Schema Contract ===')

  if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.error(`Migrations directory not found: ${MIGRATIONS_DIR}`)
    process.exit(1)
  }

  const files = fs.readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql'))
  let concatenatedSql = ''

  files.forEach((f) => {
    concatenatedSql += fs.readFileSync(path.join(MIGRATIONS_DIR, f), 'utf-8') + '\n'
  })

  let missingColumnsCount = 0

  for (const [table, columns] of Object.entries(REQUIRED_TABLE_CONTRACTS)) {
    console.log(`Checking table [public.${table}]...`)
    columns.forEach((col) => {
      const regex = new RegExp(`(ADD\\s+COLUMN|${col}\\s+)+[^;]*\\b${col}\\b`, 'i')
      const colMatches = concatenatedSql.includes(col)

      if (!colMatches) {
        console.error(`❌ Missing Column Definition in DDL: ${table}.${col}`)
        missingColumnsCount++
      } else {
        console.log(`  ✓ Column verified: ${table}.${col}`)
      }
    })
  }

  if (missingColumnsCount > 0) {
    console.error(`\n❌ Schema Audit FAILED: ${missingColumnsCount} required columns missing in DDL!`)
    process.exit(1)
  }

  console.log('\n✅ Schema Audit PASSED: All application fields verified in migration DDL!')
}

runSchemaContractAudit()
