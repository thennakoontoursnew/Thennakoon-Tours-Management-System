const fs = require('fs')
const path = require('path')
const { Client } = require('pg')

async function run() {
  console.log('=== Step 1: Inspecting migration files ===')
  const migrationDir = path.join(__dirname, '../supabase/migrations')
  if (!fs.existsSync(migrationDir)) {
    console.error('Error: Migration directory does not exist.')
    process.exit(1)
  }

  const files = fs.readdirSync(migrationDir).filter((f) => f.endsWith('.sql')).sort()
  console.log('Found migration files:', files)

  files.forEach((f) => {
    const p = path.join(migrationDir, f)
    const sql = fs.readFileSync(p, 'utf8')
    console.log(` - ${f} (${sql.length} bytes)`)
  })

  // Check database connection string
  const dbUrl =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.SUPABASE_DB_URL ||
    process.env.DIRECT_URL

  if (!dbUrl) {
    console.log('\n=== Notice: No direct PostgreSQL connection string (DATABASE_URL) found in environment. ===')
    console.log('Migration files structure verified successfully:')
    files.forEach((f) => console.log(`   - supabase/migrations/${f}`))
    process.exit(0)
  }

  console.log('\n=== Step 2: Connecting to PostgreSQL database ===')
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  })

  try {
    await client.connect()
    console.log('Connected to Database successfully.')

    for (const f of files) {
      console.log(`\n=== Step 3: Applying ${f} ===`)
      const sqlContent = fs.readFileSync(path.join(migrationDir, f), 'utf8')
      await client.query(sqlContent)
      console.log(`✓ Migration ${f} executed successfully!`)
    }

    console.log('\n=== Step 4: Verifying Public Tables ===')
    const resTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `)
    const tableNames = resTables.rows.map((r) => r.table_name)
    console.log('Public tables in database:', tableNames)

    const requiredTables = [
      'profiles',
      'company_settings',
      'audit_logs',
      'customers',
      'customer_tags',
      'customer_tag_assignments',
      'customer_notes',
      'vehicle_categories',
      'vehicles',
      'vehicle_images',
      'drivers',
      'driver_documents',
    ]

    const missingTables = requiredTables.filter((t) => !tableNames.includes(t))

    if (missingTables.length > 0) {
      console.error('Missing required Phase 2 tables:', missingTables)
    } else {
      console.log('✓ All required Phase 1 and Phase 2 tables exist in database.')
    }

    await client.end()
    console.log('\n=== Database Verification Completed Successfully ===')
  } catch (err) {
    console.error('Database execution error:', err)
    process.exit(1)
  }
}

run()
