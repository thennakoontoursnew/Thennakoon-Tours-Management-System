import { getColomboTodayString } from '@/lib/utils/colombo-date-utils'

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

  const activeUser = userItems.filter((u: any) => ['active', 'generated', 'signed'].includes(u.status)).length
  const activeOwner = ownerItems.filter((o: any) => o.status === 'active' || o.status === 'signed').length
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
