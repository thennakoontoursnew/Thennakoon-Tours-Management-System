import { getColomboTodayString } from '@/lib/utils/colombo-date-utils'
import { getInitialUserAgreementFormData } from './user-agreement-service'
import { USER_AGREEMENT_VERSION, USER_AGREEMENT_COMPANY_REG_NO } from './templates/user-agreement-v1'

export interface AgreementsKPIs {
  totalAgreements: number
  userAgreementsCount: number
  ownerAgreementsCount: number
  activeAgreementsCount: number
  expiringSoonCount: number
}

export async function getAgreementsKPIs(supabase: any): Promise<AgreementsKPIs> {
  const todayStr = getColomboTodayString()
  const d30Future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const [userRes, ownerRes] = await Promise.all([
    supabase.from('rental_agreements').select('id, status, rental_end_at'),
    supabase.from('owner_agreements').select('id, status, agreement_end_date').eq('is_archived', false),
  ])

  const userItems = userRes.data || []
  const ownerItems = ownerRes.data || []

  const userAgreementsCount = userItems.length
  const ownerAgreementsCount = ownerItems.length
  const totalAgreements = userAgreementsCount + ownerAgreementsCount

  // Active status: excludes cancelled and completed
  const activeUser = userItems.filter((u: any) => ['active', 'generated', 'signed'].includes(u.status)).length
  const activeOwner = ownerItems.filter((o: any) => ['active', 'signed'].includes(o.status)).length
  const activeAgreementsCount = activeUser + activeOwner

  let expiringSoonCount = 0

  userItems.forEach((u: any) => {
    if (['active', 'generated', 'signed'].includes(u.status) && u.rental_end_at) {
      const endDay = u.rental_end_at.slice(0, 10)
      if (endDay >= todayStr && endDay <= d30Future) {
        expiringSoonCount++
      }
    }
  })

  ownerItems.forEach((o: any) => {
    if (['active', 'signed'].includes(o.status) && o.agreement_end_date) {
      if (o.agreement_end_date >= todayStr && o.agreement_end_date <= d30Future) {
        expiringSoonCount++
      }
    }
  })

  return {
    totalAgreements,
    userAgreementsCount,
    ownerAgreementsCount,
    activeAgreementsCount,
    expiringSoonCount,
  }
}

export async function getUserAgreements(supabase: any) {
  const { data } = await supabase
    .from('rental_agreements')
    .select('*, customer:customers(id, full_name, mobile, email), booking:bookings(id, booking_number, pickup_location, dropoff_location)')
    .order('created_at', { ascending: false })

  return data || []
}

export async function getUserAgreementById(supabase: any, id: string) {
  console.log('[USER AGREEMENT PREVIEW] STEP 1 - Load Agreement ID:', id)
  const { data: agreement, error: aErr } = await supabase
    .from('rental_agreements')
    .select('*, customer:customers(*), booking:bookings(*)')
    .eq('id', id)
    .maybeSingle()

  if (aErr) {
    console.error('[USER AGREEMENT PREVIEW] STEP 1 ERROR:', {
      code: aErr.code,
      message: aErr.message,
      details: aErr.details,
      hint: aErr.hint,
    })
  }

  if (!agreement) return null

  // STEP 2 - Detect Template Version & Snapshot Health
  let isV1 = agreement.template_version === USER_AGREEMENT_VERSION || (agreement.lessee_snapshot && Object.keys(agreement.lessee_snapshot).length > 0)

  // CRITICAL FIX: If template_version is missing/NULL or V1 snapshots are unpopulated, but a booking exists, auto-populate V1 snapshots dynamically!
  if (!isV1 && agreement.booking_id) {
    try {
      console.log('[USER AGREEMENT PREVIEW] Dynamically upgrading agreement record to USER_AGREEMENT_V1 snapshots')
      const initialForm = await getInitialUserAgreementFormData(supabase, agreement.booking_id)
      agreement.template_version = USER_AGREEMENT_VERSION
      agreement.lessee_snapshot = agreement.lessee_snapshot || initialForm.lessee
      agreement.vehicle_snapshot = agreement.vehicle_snapshot || initialForm.vehicle
      agreement.rental_snapshot = agreement.rental_snapshot || initialForm.rental
      agreement.agreement_variables_snapshot = agreement.agreement_variables_snapshot || initialForm.variables
      agreement.company_snapshot = agreement.company_snapshot || { name: 'Thennakoon Tours (Pvt) Ltd', reg_no: USER_AGREEMENT_COMPANY_REG_NO }
      agreement.nominated_drivers_snapshot = agreement.nominated_drivers_snapshot || initialForm.nominated_drivers
      agreement.witnesses_snapshot = agreement.witnesses_snapshot || initialForm.witnesses
      agreement.lessor_representative_snapshot = agreement.lessor_representative_snapshot || initialForm.lessor_representative
      agreement.pickup_delivery_snapshot = agreement.pickup_delivery_snapshot || initialForm.pickup_delivery
      isV1 = true

      // Persist the V1 upgrade to database asynchronously for future loads
      await supabase
        .from('rental_agreements')
        .update({
          template_version: USER_AGREEMENT_VERSION,
          lessee_snapshot: agreement.lessee_snapshot,
          vehicle_snapshot: agreement.vehicle_snapshot,
          rental_snapshot: agreement.rental_snapshot,
          agreement_variables_snapshot: agreement.agreement_variables_snapshot,
          company_snapshot: agreement.company_snapshot,
          nominated_drivers_snapshot: agreement.nominated_drivers_snapshot,
          witnesses_snapshot: agreement.witnesses_snapshot,
          lessor_representative_snapshot: agreement.lessor_representative_snapshot,
          pickup_delivery_snapshot: agreement.pickup_delivery_snapshot,
          updated_at: new Date().toISOString(),
        })
        .eq('id', agreement.id)
    } catch (err) {
      console.warn('[USER AGREEMENT PREVIEW] Dynamic V1 upgrade failed:', err)
    }
  }

  // Mandatory V1 Enforcement: If template_version === 'USER_AGREEMENT_V1', isV1 MUST BE TRUE!
  if (agreement.template_version === USER_AGREEMENT_VERSION) {
    isV1 = true
  }

  console.log('[USER AGREEMENT PREVIEW] STEP 2 - Final Template Version Decision:', {
    template_version: agreement.template_version,
    isV1,
  })

  // STEP 3 - Load Legacy/New Data
  let bookingData: any = agreement.booking || null
  let customerData: any = agreement.customer || null
  let vehicleData: any = null

  if (agreement.booking_id && !bookingData) {
    const { data: b } = await supabase.from('bookings').select('*, customer:customers(*)').eq('id', agreement.booking_id).maybeSingle()
    if (b) {
      bookingData = b
      if (!customerData) customerData = b.customer
    }
  }

  if (agreement.customer_id && !customerData) {
    const { data: c } = await supabase.from('customers').select('*').eq('id', agreement.customer_id).maybeSingle()
    if (c) customerData = c
  }

  // Fetch allocated vehicle for legacy records
  if (agreement.booking_id) {
    const { data: bvs } = await supabase
      .from('booking_vehicles')
      .select('*, vehicle:vehicles(*)')
      .eq('booking_id', agreement.booking_id)
      .limit(1)

    if (bvs && bvs.length > 0) {
      vehicleData = bvs[0].vehicle
    }
  }

  const { data: companySettings } = await supabase
    .from('company_settings')
    .select('*')
    .limit(1)
    .maybeSingle()

  return {
    agreement,
    isV1,
    booking: bookingData,
    customer: customerData,
    vehicle: vehicleData,
    companySettings,
  }
}

export async function getOwnerAgreements(supabase: any, ownerId?: string) {
  let query = supabase
    .from('owner_agreements')
    .select('*, owner:vehicle_owners(id, owner_number, full_name, mobile, email, company_name), vehicles:owner_agreement_vehicles(id, vehicle_id, vehicle:vehicles(id, vehicle_name, registration_number))')
    .eq('is_archived', false)
    .order('created_at', { ascending: false })

  if (ownerId) {
    query = query.eq('vehicle_owner_id', ownerId)
  }

  const { data } = await query
  return data || []
}

export async function getOwnerAgreementById(supabase: any, id: string) {
  const { data: agreement } = await supabase
    .from('owner_agreements')
    .select('*, owner:vehicle_owners(*), vehicles:owner_agreement_vehicles(id, vehicle_id, agreed_rate, revenue_share_pct, flat_rate_per_day, notes, vehicle:vehicles(*))')
    .eq('id', id)
    .single()

  if (!agreement) return null

  // Fetch related payouts and statements for owner
  const [payoutsRes, statementsRes] = await Promise.all([
    supabase.from('owner_payouts').select('*').eq('vehicle_owner_id', agreement.vehicle_owner_id).order('period_start', { ascending: false }).limit(10),
    supabase.from('owner_statements').select('*').eq('vehicle_owner_id', agreement.vehicle_owner_id).order('period_start', { ascending: false }).limit(10),
  ])

  return {
    agreement,
    payouts: payoutsRes.data || [],
    statements: statementsRes.data || [],
  }
}
