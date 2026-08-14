-- Migration: Commercial Invoice Upgrade
-- Non-destructive additions for deductions, additional charges, descriptions, and customer/vehicle/staff snapshots

ALTER TABLE invoices 
  ADD COLUMN IF NOT EXISTS discount_description text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deduction_description text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS additional_charges numeric NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS additional_charge_description text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS prepared_by_name_snapshot text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS prepared_by_designation_snapshot text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS customer_snapshot jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS rental_vehicle_snapshot jsonb DEFAULT NULL;
