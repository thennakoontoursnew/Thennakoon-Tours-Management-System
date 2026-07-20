import { z } from 'zod'
import { sanitizePayload } from './master-data'

export { sanitizePayload }

// 1. Quotation Item Schema
export const quotationItemSchema = z.object({
  id: z.string().optional(),
  vehicle_id: z.string().uuid().optional().nullable(),
  description: z.string().min(1, 'Item description is required'),
  vehicle_name_snapshot: z.string().optional().nullable(),
  vehicle_registration_snapshot: z.string().optional().nullable(),
  vehicle_year_snapshot: z.number().optional().nullable(),
  quantity: z.number().min(1, 'Quantity must be at least 1').default(1),
  number_of_days: z.number().min(1, 'Number of days must be at least 1').default(1),
  unit_rate: z.number().min(0, 'Unit rate cannot be negative').default(0),
  allowed_km: z.number().min(0).optional().nullable(),
  extra_km_charge: z.number().min(0).optional().nullable(),
  deposit_amount: z.number().min(0).default(0),
  driver_charge: z.number().min(0).default(0),
  additional_charge: z.number().min(0).default(0),
  display_order: z.number().int().default(0),
})

// 2. Quotation Schema
export const quotationSchema = z.object({
  customer_id: z.string().uuid('Please select a valid customer'),
  quotation_date: z.string().min(1, 'Quotation date is required'),
  valid_until: z.string().optional().nullable(),
  rental_start_date: z.string().min(1, 'Rental start date is required'),
  rental_end_date: z.string().min(1, 'Rental end date is required'),
  pickup_location: z.string().optional().nullable(),
  dropoff_location: z.string().optional().nullable(),
  destination: z.string().optional().nullable(),
  passenger_count: z.number().int().positive().optional().nullable(),
  purpose: z.string().optional().nullable(),
  currency: z.string().default('LKR'),
  discount_type: z.enum(['none', 'percentage', 'fixed']).default('none'),
  discount_value: z.number().min(0).default(0),
  tax_rate: z.number().min(0).max(100).default(0),
  refundable_deposit: z.number().min(0).default(0),
  additional_charges: z.number().min(0).default(0),
  notes: z.string().optional().nullable(),
  special_notes: z.string().optional().nullable(),
  important_message: z.string().optional().nullable(),
  bank_details_snapshot: z.any().optional().nullable(),
  prepared_by_label_snapshot: z.string().optional().nullable(),
  terms_and_conditions: z.string().optional().nullable(),
  status: z.enum(['draft', 'generated', 'sent', 'accepted', 'rejected', 'expired', 'cancelled']).default('draft'),
  items: z.array(quotationItemSchema).min(1, 'At least one vehicle item is required'),
})

// 3. Booking Vehicle Schema
export const bookingVehicleSchema = z.object({
  id: z.string().optional(),
  vehicle_id: z.string().uuid('Please select a valid vehicle'),
  driver_id: z.string().uuid().optional().nullable(),
  rental_start_at: z.string().min(1, 'Vehicle start time is required'),
  rental_end_at: z.string().min(1, 'Vehicle end time is required'),
  vehicle_rate: z.number().min(0).default(0),
  driver_charge: z.number().min(0).default(0),
  deposit_amount: z.number().min(0).default(0),
  allowed_km: z.number().min(0).optional().nullable(),
  extra_km_charge: z.number().min(0).optional().nullable(),
  pickup_mileage: z.number().min(0).optional().nullable(),
  return_mileage: z.number().min(0).optional().nullable(),
  pickup_fuel_level: z.number().min(0).max(100).optional().nullable(),
  return_fuel_level: z.number().min(0).max(100).optional().nullable(),
  notes: z.string().optional().nullable(),
})

// 4. Booking Schema
export const bookingSchema = z.object({
  quotation_id: z.string().uuid().optional().nullable(),
  customer_id: z.string().uuid('Please select a valid customer'),
  booking_date: z.string().min(1, 'Booking date is required'),
  rental_start_at: z.string().min(1, 'Rental start date & time is required'),
  rental_end_at: z.string().min(1, 'Rental end date & time is required'),
  pickup_location: z.string().optional().nullable(),
  dropoff_location: z.string().optional().nullable(),
  destination: z.string().optional().nullable(),
  passenger_count: z.number().int().positive().optional().nullable(),
  special_requests: z.string().optional().nullable(),
  status: z.enum(['pending', 'confirmed', 'vehicle_assigned', 'driver_assigned', 'ready', 'on_trip', 'completed', 'cancelled', 'no_show']).default('pending'),
  discount_amount: z.number().min(0).default(0),
  tax_amount: z.number().min(0).default(0),
  refundable_deposit: z.number().min(0).default(0),
  advance_required: z.number().min(0).default(0),
  vehicles: z.array(bookingVehicleSchema).min(1, 'At least one vehicle must be assigned to the booking'),
})

// 5. Invoice Item Schema
export const invoiceItemSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, 'Line item description is required'),
  quantity: z.number().min(0.01).default(1),
  unit_price: z.number().min(0).default(0),
  vehicle_id: z.string().uuid().optional().nullable(),
  display_order: z.number().int().default(0),
})

// 6. Invoice Schema
export const invoiceSchema = z.object({
  booking_id: z.string().uuid().optional().nullable(),
  quotation_id: z.string().uuid().optional().nullable(),
  customer_id: z.string().uuid('Please select a customer'),
  invoice_date: z.string().min(1, 'Invoice date is required'),
  due_date: z.string().optional().nullable(),
  payment_terms: z.string().optional().nullable(),
  nature_of_invoice: z.string().optional().nullable(),
  delivery_date: z.string().optional().nullable(),
  currency: z.string().default('LKR'),
  discount_amount: z.number().min(0).default(0),
  tax_rate: z.number().min(0).max(100).default(0),
  refundable_deposit: z.number().min(0).default(0),
  total_deductions: z.number().min(0).default(0),
  notes: z.string().optional().nullable(),
  special_notes: z.string().optional().nullable(),
  important_message: z.string().optional().nullable(),
  status: z.enum(['draft', 'issued', 'partially_paid', 'paid', 'overdue', 'cancelled']).default('draft'),
  items: z.array(invoiceItemSchema).min(1, 'At least one invoice line item is required'),
})

// 7. Payment Schema
export const paymentSchema = z.object({
  invoice_id: z.string().uuid().optional().nullable(),
  booking_id: z.string().uuid().optional().nullable(),
  customer_id: z.string().uuid('Customer ID is required'),
  payment_date: z.string().min(1, 'Payment date is required'),
  amount: z.number().positive('Payment amount must be greater than 0'),
  payment_method: z.enum(['cash', 'bank_transfer', 'card', 'online', 'cheque', 'other']),
  reference_number: z.string().optional().nullable(),
  bank_name: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.enum(['pending', 'completed', 'failed', 'refunded', 'cancelled']).default('completed'),
})

// 8. Rental Agreement Schema
export const rentalAgreementSchema = z.object({
  booking_id: z.string().uuid('Please select a booking'),
  customer_id: z.string().uuid('Customer ID is required'),
  agreement_date: z.string().min(1, 'Agreement date is required'),
  rental_start_at: z.string().min(1, 'Rental start time is required'),
  rental_end_at: z.string().min(1, 'Rental end time is required'),
  terms_snapshot: z.string().min(10, 'Terms and conditions content is required'),
  status: z.enum(['draft', 'generated', 'signed', 'completed', 'cancelled']).default('draft'),
})
