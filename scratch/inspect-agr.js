const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

let url = process.env.NEXT_PUBLIC_SUPABASE_URL
let key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (fs.existsSync('.env.local')) {
  const lines = fs.readFileSync('.env.local', 'utf8').split('\n')
  for (const line of lines) {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '')
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '')
  }
}

console.log('Supabase URL:', url)
if (!url || !key) {
  console.log('Env vars missing.')
  process.exit(0)
}

const supabase = createClient(url, key)

async function inspect() {
  const id = 'a113600d-9982-40df-bc67-e84ebe8fbf9d'
  const { data: agr, error: aErr } = await supabase.from('rental_agreements').select('*').eq('id', id).maybeSingle()
  console.log('=== AGREEMENT ROW ===')
  console.log(JSON.stringify(agr, null, 2))
  if (aErr) console.log('aErr:', aErr)

  if (agr) {
    if (agr.booking_id) {
      const { data: b } = await supabase.from('bookings').select('*').eq('id', agr.booking_id).maybeSingle()
      console.log('=== BOOKING ROW ===')
      console.log(JSON.stringify(b, null, 2))

      const { data: bvs } = await supabase.from('booking_vehicles').select('*, vehicle:vehicles(*)').eq('booking_id', agr.booking_id)
      console.log('=== BOOKING VEHICLES ===')
      console.log(JSON.stringify(bvs, null, 2))
    }
    if (agr.customer_id) {
      const { data: c } = await supabase.from('customers').select('*').eq('id', agr.customer_id).maybeSingle()
      console.log('=== CUSTOMER ROW ===')
      console.log(JSON.stringify(c, null, 2))
    }
  }

  const { data: comp } = await supabase.from('company_settings').select('*').limit(1).maybeSingle()
  console.log('=== COMPANY SETTINGS ===')
  console.log(JSON.stringify(comp, null, 2))
}

inspect()
