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

  const files = fs.readdirSync(migrationDir)
  console.log('Found migration files:', files)

  const initialMigrationFile = files.find((f) => f.endsWith('_initial_schema.sql'))
  if (!initialMigrationFile) {
    console.error('Error: Initial migration file not found in supabase/migrations.')
    process.exit(1)
  }

  const migrationPath = path.join(migrationDir, initialMigrationFile)
  const sqlContent = fs.readFileSync(migrationPath, 'utf8')
  console.log(`Verified migration file exists: ${initialMigrationFile} (${sqlContent.length} bytes)`)

  // Check database connection string
  const dbUrl =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.SUPABASE_DB_URL ||
    process.env.DIRECT_URL

  if (!dbUrl) {
    console.log('\n=== Notice: No direct PostgreSQL connection string (DATABASE_URL) found in environment. ===')
    console.log('To apply the migration automatically, please set DATABASE_URL or SUPABASE_DB_URL in .env.local.')
    console.log('Alternatively, you can apply the migration file directly in the Supabase SQL Editor:')
    console.log(`Path: ${migrationPath}`)
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

    console.log('\n=== Step 3: Applying migration SQL ===')
    await client.query(sqlContent)
    console.log('Migration executed successfully!')

    console.log('\n=== Step 4: Verifying Public Tables ===')
    const resTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `)
    const tableNames = resTables.rows.map((r) => r.table_name)
    console.log('Public tables in database:', tableNames)

    const requiredTables = ['profiles', 'company_settings', 'audit_logs']
    const missingTables = requiredTables.filter((t) => !tableNames.includes(t))

    if (missingTables.length > 0) {
      console.error('Missing required tables:', missingTables)
    } else {
      console.log('✓ All required tables exist: profiles, company_settings, audit_logs.')
    }

    console.log('\n=== Step 5: Verifying Row Level Security (RLS) ===')
    const resRLS = await client.query(`
      SELECT tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public';
    `)
    console.log('RLS Status per table:')
    resRLS.rows.forEach((r) => {
      console.log(` - ${r.tablename}: RLS = ${r.rowsecurity}`)
    })

    console.log('\n=== Step 6: Verifying Triggers ===')
    const resTriggers = await client.query(`
      SELECT trigger_name, event_object_table 
      FROM information_schema.triggers 
      WHERE trigger_schema = 'public' OR event_object_table = 'users';
    `)
    console.log('Triggers found:')
    resTriggers.rows.forEach((r) => {
      console.log(` - ${r.trigger_name} on ${r.event_object_table}`)
    })

    console.log('\n=== Step 7: Verifying RPC Functions ===')
    const resFunctions = await client.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public';
    `)
    const functionNames = resFunctions.rows.map((r) => r.routine_name)
    console.log('RPC functions found:', functionNames)

    await client.end()
    console.log('\n=== Database Verification Completed Successfully ===')
  } catch (err) {
    console.error('Database execution error:', err)
    process.exit(1)
  }
}

run()
