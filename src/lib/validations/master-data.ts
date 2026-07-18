import { z } from 'zod'

// Sanitizer helper: Converts empty string "" or whitespace to null for clean DB insertion
export function sanitizePayload<T extends Record<string, any>>(data: T): T {
  const sanitized = { ...data }
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      const trimmed = (sanitized[key] as string).trim()
      if (trimmed === '') {
        ;(sanitized as any)[key] = null
      } else {
        ;(sanitized as any)[key] = trimmed
      }
    }
  }
  return sanitized
}

// 1. Customer Validation Schema
export const customerSchema = z.object({
  customer_type: z.enum(['individual', 'company']),
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  company_name: z.string().optional().nullable(),
  nic: z.string().optional().nullable(),
  passport_number: z.string().optional().nullable(),
  nationality: z.string().optional().nullable(),
  date_of_birth: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  mobile: z.string().min(8, 'Mobile phone number is required'),
  whatsapp: z.string().optional().nullable(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')).nullable(),
  address_line_1: z.string().optional().nullable(),
  address_line_2: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  country: z.string().default('Sri Lanka').optional().nullable(),
  driving_license_number: z.string().optional().nullable(),
  driving_license_expiry: z.string().optional().nullable(),
  source: z
    .enum([
      'facebook',
      'instagram',
      'tiktok',
      'youtube',
      'whatsapp',
      'website',
      'google',
      'referral',
      'walk_in',
      'travel_agent',
      'hotel',
      'corporate',
      'other',
    ])
    .optional()
    .nullable(),
  preferred_vehicle_id: z.string().uuid().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.enum(['active', 'inactive', 'blacklisted']).default('active'),
})

// 2. Customer Note Schema
export const customerNoteSchema = z.object({
  customer_id: z.string().uuid('Invalid customer ID'),
  note: z.string().min(2, 'Note content cannot be empty'),
})

// 3. Vehicle Category Schema
export const vehicleCategorySchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters'),
  slug: z.string().min(2, 'Category slug is required'),
  description: z.string().optional().nullable(),
  display_order: z.number().int().default(0),
  is_active: z.boolean().default(true),
})

// 4. Vehicle Validation Schema
export const vehicleSchema = z.object({
  vehicle_name: z.string().min(2, 'Vehicle name is required'),
  brand: z.string().min(1, 'Brand is required'),
  model: z.string().min(1, 'Model is required'),
  manufacture_year: z.number().int().min(1950, 'Invalid manufacture year').max(2100).optional().nullable(),
  category_id: z.string().uuid('Please select a valid vehicle category'),
  registration_number: z.string().min(2, 'Registration number is required'),
  chassis_number: z.string().optional().nullable(),
  engine_number: z.string().optional().nullable(),
  transmission: z.enum(['automatic', 'manual', 'semi_automatic']).default('automatic'),
  fuel_type: z.enum(['petrol', 'diesel', 'hybrid', 'electric', 'plug_in_hybrid']).default('petrol'),
  seat_count: z.number().int().positive('Seat count must be positive').optional().nullable(),
  colour: z.string().optional().nullable(),
  current_mileage: z.number().min(0, 'Mileage cannot be negative').default(0),
  daily_rate: z.number().min(0, 'Daily rate cannot be negative'),
  weekly_rate: z.number().min(0, 'Weekly rate cannot be negative').optional().nullable(),
  monthly_rate: z.number().min(0, 'Monthly rate cannot be negative').optional().nullable(),
  refundable_deposit: z.number().min(0, 'Refundable deposit cannot be negative').default(0),
  allowed_km_per_day: z.number().min(0).optional().nullable(),
  extra_km_charge: z.number().min(0).optional().nullable(),
  fuel_capacity_litres: z.number().min(0).optional().nullable(),
  service_due_mileage: z.number().min(0).optional().nullable(),
  next_service_date: z.string().optional().nullable(),
  insurance_expiry: z.string().optional().nullable(),
  revenue_license_expiry: z.string().optional().nullable(),
  emission_test_expiry: z.string().optional().nullable(),
  gps_installed: z.boolean().default(false),
  status: z.enum(['available', 'reserved', 'on_trip', 'maintenance', 'inactive']).default('available'),
  description: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

// 5. Driver Validation Schema
export const driverSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  nic: z.string().min(5, 'NIC number is required'),
  date_of_birth: z.string().optional().nullable(),
  mobile: z.string().min(8, 'Mobile number is required'),
  whatsapp: z.string().optional().nullable(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')).nullable(),
  address: z.string().optional().nullable(),
  emergency_contact_name: z.string().optional().nullable(),
  emergency_contact_phone: z.string().optional().nullable(),
  license_number: z.string().min(2, 'License number is required'),
  license_expiry: z.string().optional().nullable(),
  date_joined: z.string().optional().nullable(),
  police_clearance_expiry: z.string().optional().nullable(),
  medical_expiry: z.string().optional().nullable(),
  status: z.enum(['available', 'assigned', 'on_leave', 'inactive']).default('available'),
  notes: z.string().optional().nullable(),
})
