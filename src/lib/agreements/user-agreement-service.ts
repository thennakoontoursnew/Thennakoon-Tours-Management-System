import { getColomboTodayString } from '@/lib/utils/colombo-date-utils'
import {
  USER_AGREEMENT_VERSION,
  REQUIRED_USER_AGREEMENT_TOKENS,
} from './templates/user-agreement-v1'

export interface UserAgreementFormData {
  id?: string
  agreement_number: string
  booking_id: string
  customer_id: string
  vehicle_id?: string
  template_version: string

  // Section A: Agreement Info
  agreement_date: string
  rental_start_at: string
  rental_end_at: string
  rental_period_days: number
  rental_period_weeks?: number
  rental_period_months?: number

  // Section B: Lessee Info
  lessee: {
    full_name: string
    company_name?: string
    nic?: string
    passport_number?: string
    identifier_type: 'NIC' | 'Passport'
    identifier_no: string
    mobile: string
    fixed_line?: string
    email?: string
    address: string
    nationality?: string
    driving_license_number?: string
    driving_license_expiry?: string
  }

  // Section C: Vehicle Info
  vehicle: {
    id?: string
    vehicle_name: string
    make_model: string
    registration_number: string
    color?: string
    fuel_type?: string
    category_name?: string
    pickup_odometer?: number
  }

  // Section D & E: Rental & Financial Information
  rental: {
    daily_rental_rate: number
    monthly_rental_rate?: number
    security_deposit: number
    advance_paid: number
    balance_due: number
    allowed_km_per_day: number
    extra_km_rate: number
    delivery_fee?: number
    pickup_fee?: number
  }

  // Section F: Nominated Drivers
  nominated_drivers: Array<{
    name: string
    identifier_no?: string
    license_number: string
    address?: string
    mobile?: string
  }>

  // Section G: Pickup & Delivery Info
  pickup_delivery: {
    pickup_location: string
    pickup_time?: string
    dropoff_location: string
    delivery_fee_to?: string
    pickup_fee_from?: string
  }

  // Section H: Special & Inventory Notes
  special_notes?: string
  inventory_remarks?: string

  // Section I: Lessor Representative
  lessor_representative: {
    name: string
    position: string
    signature_date: string
  }

  // Section J: Witnesses
  witnesses: {
    witness_1: { name: string; address?: string; mobile?: string }
    witness_2: { name: string; address?: string; mobile?: string }
  }

  // Section K: Configurable Agreement Variables
  variables: {
    minor_repair_limit: number
    insurance_excess: number
    cleaning_fee: number
    full_interior_cleaning_fee: number
    additional_driver_fee: number
    security_deposit_hold_days: number
    notice_period_days: number
    agreement_location: string
    company_hotline: string
    company_bank_details: string
  }
}

export async function getInitialUserAgreementFormData(
  supabase: any,
  bookingId: string
): Promise<UserAgreementFormData> {
  const todayStr = getColomboTodayString()

  // 1. Fetch Booking details
  const { data: booking, error: bErr } = await supabase
    .from('bookings')
    .select('*, customer:customers(*)')
    .eq('id', bookingId)
    .single()

  if (bErr || !booking) {
    throw new Error('Booking not found.')
  }

  const customer = booking.customer || {}

  // 2. Fetch Allocated Vehicle
  const { data: bVehicles } = await supabase
    .from('booking_vehicles')
    .select('*, vehicle:vehicles(*), driver:drivers(*)')
    .eq('booking_id', bookingId)

  const firstBV = bVehicles && bVehicles.length > 0 ? bVehicles[0] : null
  const vehicleObj = firstBV?.vehicle || {}

  // 3. Fetch Quotation if linked
  let quotation: any = null
  if (booking.quotation_id) {
    const { data: q } = await supabase
      .from('quotations')
      .select('*')
      .eq('id', booking.quotation_id)
      .maybeSingle()
    quotation = q
  }

  // 4. Fetch Company Settings
  const { data: companySettings } = await supabase
    .from('company_settings')
    .select('*')
    .limit(1)
    .maybeSingle()

  // 5. Generate Next Agreement Number
  let agreementNumber = `AGR-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`
  try {
    const { data: genNum } = await supabase.rpc('generate_next_agreement_number')
    if (genNum) agreementNumber = genNum
  } catch (_) {}

  // Calculate rental period
  const startMs = new Date(booking.rental_start_at).getTime()
  const endMs = new Date(booking.rental_end_at).getTime()
  const totalDays = Math.max(1, Math.ceil((endMs - startMs) / (1000 * 60 * 60 * 24)))

  const lesseeNic = customer.nic || ''
  const lesseePassport = customer.passport_number || ''
  const identifierType = lesseeNic ? 'NIC' : 'Passport'
  const identifierNo = lesseeNic || lesseePassport || 'N/A'

  return {
    agreement_number: agreementNumber,
    booking_id: booking.id,
    customer_id: customer.id,
    vehicle_id: vehicleObj.id,
    template_version: USER_AGREEMENT_VERSION,

    agreement_date: todayStr,
    rental_start_at: booking.rental_start_at,
    rental_end_at: booking.rental_end_at,
    rental_period_days: totalDays,
    rental_period_weeks: Math.round((totalDays / 7) * 10) / 10,
    rental_period_months: Math.round((totalDays / 30) * 10) / 10,

    lessee: {
      full_name: customer.full_name || '',
      company_name: customer.company_name || '',
      nic: lesseeNic,
      passport_number: lesseePassport,
      identifier_type: identifierType,
      identifier_no: identifierNo,
      mobile: customer.mobile || '',
      fixed_line: '',
      email: customer.email || '',
      address: customer.address || customer.address_line_1 || 'Sri Lanka',
      nationality: customer.nationality || 'Sri Lankan',
      driving_license_number: customer.driving_license_number || '',
      driving_license_expiry: customer.driving_license_expiry || '',
    },

    vehicle: {
      id: vehicleObj.id,
      vehicle_name: vehicleObj.vehicle_name || 'Vehicle Allocated',
      make_model: `${vehicleObj.brand || ''} ${vehicleObj.model || ''}`.trim() || vehicleObj.vehicle_name || 'Toyota Axio',
      registration_number: vehicleObj.registration_number || 'TBD',
      color: vehicleObj.color || 'White',
      fuel_type: vehicleObj.fuel_type || 'Petrol',
      category_name: vehicleObj.vehicle_category || 'Sedan',
      pickup_odometer: vehicleObj.current_mileage || 0,
    },

    rental: {
      daily_rental_rate: vehicleObj.daily_rate || booking.daily_rate || 7500,
      monthly_rental_rate: quotation?.monthly_rate || undefined,
      security_deposit: booking.refundable_deposit || vehicleObj.refundable_deposit || 50000,
      advance_paid: booking.advance_paid || 0,
      balance_due: booking.balance_due || 0,
      allowed_km_per_day: vehicleObj.allowed_km_per_day || companySettings?.default_allowed_km_per_day || 100,
      extra_km_rate: vehicleObj.extra_km_charge || companySettings?.default_extra_km_rate || 75,
      delivery_fee: booking.delivery_fee || 0,
      pickup_fee: booking.pickup_fee || 0,
    },

    nominated_drivers: [
      {
        name: customer.full_name || 'Lessee',
        identifier_no: identifierNo,
        license_number: customer.driving_license_number || 'N/A',
        address: customer.address || '',
        mobile: customer.mobile || '',
      },
    ],

    pickup_delivery: {
      pickup_location: booking.pickup_location || 'Pagoda Road, Nugegoda',
      pickup_time: '09:00 AM',
      dropoff_location: booking.dropoff_location || 'Pagoda Road, Nugegoda',
      delivery_fee_to: '',
      pickup_fee_from: '',
    },

    special_notes: booking.special_notes || '',
    inventory_remarks: 'Vehicle inspected with spare wheel, jack, and tools.',

    lessor_representative: {
      name: 'Authorized Officer',
      position: 'Operations Executive',
      signature_date: todayStr,
    },

    witnesses: {
      witness_1: { name: '', address: '', mobile: '' },
      witness_2: { name: '', address: '', mobile: '' },
    },

    variables: {
      minor_repair_limit: companySettings?.default_minor_repair_limit || 5000,
      insurance_excess: companySettings?.default_insurance_excess || 25000,
      cleaning_fee: companySettings?.default_cleaning_fee || 3500,
      full_interior_cleaning_fee: companySettings?.default_full_interior_cleaning_fee || 7500,
      additional_driver_fee: companySettings?.default_additional_driver_fee || 2500,
      security_deposit_hold_days: companySettings?.default_security_deposit_hold_days || 14,
      notice_period_days: companySettings?.default_notice_period_days || 30,
      agreement_location: companySettings?.default_agreement_location || 'Nugegoda, Sri Lanka',
      company_hotline: companySettings?.default_company_hotline || '+94 112 823 723 / +94 760 080 155',
      company_bank_details: companySettings?.default_agreement_bank_info || 'Nations Trust Bank - Nugegoda Branch, Account # 100530013140, Swift Code: NTBCLKLX',
    },
  }
}

export function validateUserAgreementData(data: UserAgreementFormData): {
  isValid: boolean
  missingTokens: string[]
} {
  const missingTokens: string[] = []

  if (!data.agreement_number) missingTokens.push('AGREEMENT_NUMBER')
  if (!data.agreement_date) missingTokens.push('AGREEMENT_DATE')
  if (!data.lessee?.full_name) missingTokens.push('LESSEE_FULL_NAME')
  if (!data.lessee?.identifier_no || data.lessee.identifier_no === 'N/A') missingTokens.push('LESSEE_IDENTIFIER_NO')
  if (!data.rental_start_at) missingTokens.push('RENTAL_START')
  if (!data.rental_end_at) missingTokens.push('RENTAL_END')
  if (!data.rental?.daily_rental_rate) missingTokens.push('DAILY_RENTAL')
  if (data.rental?.security_deposit === undefined || data.rental?.security_deposit === null) missingTokens.push('SECURITY_DEPOSIT')

  return {
    isValid: missingTokens.length === 0,
    missingTokens,
  }
}
