-- Phase 2: Core Master Data Migration
-- Includes Customers, Vehicle Categories, Vehicles, Vehicle Images, Drivers, Driver Documents, Tags, Notes, Storage Buckets, and RLS

-- 1. Sequences & Generators
CREATE SEQUENCE IF NOT EXISTS public.customer_code_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS public.vehicle_code_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS public.driver_code_seq START WITH 1;

CREATE OR REPLACE FUNCTION public.generate_customer_code()
RETURNS TEXT AS $$
BEGIN
    RETURN 'CUS-' || lpad(nextval('public.customer_code_seq')::text, 6, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.generate_vehicle_code()
RETURNS TEXT AS $$
BEGIN
    RETURN 'VEH-' || lpad(nextval('public.vehicle_code_seq')::text, 6, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.generate_driver_code()
RETURNS TEXT AS $$
BEGIN
    RETURN 'DRV-' || lpad(nextval('public.driver_code_seq')::text, 6, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Vehicle Categories Table
CREATE TABLE IF NOT EXISTS public.vehicle_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed Vehicle Categories Safely
INSERT INTO public.vehicle_categories (name, slug, description, display_order)
VALUES
  ('Economy', 'economy', 'Budget-friendly compact hatchbacks and sedans', 1),
  ('Sedan', 'sedan', 'Comfortable mid-size family sedans', 2),
  ('SUV', 'suv', 'Spacious sport utility vehicles for all terrains', 3),
  ('Luxury', 'luxury', 'Premium luxury sedans and VIP SUVs', 4),
  ('Van', 'van', 'Passenger vans for group tours and airport transfers', 5),
  ('Bus', 'bus', 'Coaches and mini-buses for large tour groups', 6),
  ('Wedding', 'wedding', 'Decorated luxury cars and vintage vehicles for weddings', 7),
  ('4WD', '4wd', 'Four-wheel drive off-road safari vehicles', 8)
ON CONFLICT (slug) DO NOTHING;

-- 3. Vehicles Table
CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_code TEXT NOT NULL UNIQUE DEFAULT public.generate_vehicle_code(),
    vehicle_name TEXT NOT NULL,
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    manufacture_year INTEGER,
    category_id UUID REFERENCES public.vehicle_categories(id) ON DELETE RESTRICT,
    registration_number TEXT NOT NULL UNIQUE,
    chassis_number TEXT,
    engine_number TEXT,
    transmission TEXT NOT NULL DEFAULT 'automatic',
    fuel_type TEXT NOT NULL DEFAULT 'petrol',
    seat_count INTEGER,
    colour TEXT,
    current_mileage NUMERIC(12,2) DEFAULT 0,
    daily_rate NUMERIC(12,2) NOT NULL DEFAULT 0,
    weekly_rate NUMERIC(12,2),
    monthly_rate NUMERIC(12,2),
    refundable_deposit NUMERIC(12,2) NOT NULL DEFAULT 0,
    allowed_km_per_day NUMERIC(10,2),
    extra_km_charge NUMERIC(10,2),
    fuel_capacity_litres NUMERIC(10,2),
    service_due_mileage NUMERIC(12,2),
    next_service_date DATE,
    insurance_expiry DATE,
    revenue_license_expiry DATE,
    emission_test_expiry DATE,
    gps_installed BOOLEAN NOT NULL DEFAULT false,
    status TEXT NOT NULL DEFAULT 'available',
    description TEXT,
    notes TEXT,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    archived_at TIMESTAMPTZ,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT check_transmission CHECK (transmission IN ('automatic', 'manual', 'semi_automatic')),
    CONSTRAINT check_fuel_type CHECK (fuel_type IN ('petrol', 'diesel', 'hybrid', 'electric', 'plug_in_hybrid')),
    CONSTRAINT check_vehicle_status CHECK (status IN ('available', 'reserved', 'on_trip', 'maintenance', 'inactive')),
    CONSTRAINT check_rates_non_negative CHECK (daily_rate >= 0 AND refundable_deposit >= 0 AND (current_mileage IS NULL OR current_mileage >= 0)),
    CONSTRAINT check_seat_count_positive CHECK (seat_count IS NULL OR seat_count > 0)
);

-- 4. Customers Table
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_code TEXT NOT NULL UNIQUE DEFAULT public.generate_customer_code(),
    customer_type TEXT NOT NULL DEFAULT 'individual',
    full_name TEXT NOT NULL,
    company_name TEXT,
    nic TEXT,
    passport_number TEXT,
    nationality TEXT,
    date_of_birth DATE,
    gender TEXT,
    mobile TEXT NOT NULL,
    whatsapp TEXT,
    email TEXT,
    address_line_1 TEXT,
    address_line_2 TEXT,
    city TEXT,
    country TEXT DEFAULT 'Sri Lanka',
    driving_license_number TEXT,
    driving_license_expiry DATE,
    source TEXT,
    preferred_vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    is_archived BOOLEAN NOT NULL DEFAULT false,
    archived_at TIMESTAMPTZ,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT check_customer_type CHECK (customer_type IN ('individual', 'company')),
    CONSTRAINT check_customer_status CHECK (status IN ('active', 'inactive', 'blacklisted')),
    CONSTRAINT check_customer_source CHECK (source IS NULL OR source IN ('facebook', 'instagram', 'tiktok', 'youtube', 'whatsapp', 'website', 'google', 'referral', 'walk_in', 'travel_agent', 'hotel', 'corporate', 'other'))
);

-- Partial Unique Indexes for Customer NIC and Passport
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_nic_unique ON public.customers (nic) WHERE (nic IS NOT NULL AND nic != '');
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_passport_unique ON public.customers (passport_number) WHERE (passport_number IS NOT NULL AND passport_number != '');

-- 5. Customer Tags & Assignments
CREATE TABLE IF NOT EXISTS public.customer_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed Customer Tags Safely
INSERT INTO public.customer_tags (name, description)
VALUES
  ('vip', 'VIP High Value Client'),
  ('repeat_customer', 'Repeat Customer'),
  ('corporate', 'Corporate Business Client'),
  ('wedding', 'Wedding Car Client'),
  ('airport_transfer', 'Airport Transfer Frequent Client'),
  ('tourist', 'Foreign Tourist'),
  ('blacklisted_watch', 'Flagged for Caution'),
  ('agent', 'Travel Agent Partner')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.customer_tag_assignments (
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES public.customer_tags(id) ON DELETE CASCADE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (customer_id, tag_id)
);

-- 6. Customer Notes
CREATE TABLE IF NOT EXISTS public.customer_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_archived BOOLEAN NOT NULL DEFAULT false
);

-- 7. Vehicle Images Table
CREATE TABLE IF NOT EXISTS public.vehicle_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    public_url TEXT,
    alt_text TEXT,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    display_order INTEGER NOT NULL DEFAULT 0,
    uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Single Primary Image Constraint per vehicle
CREATE UNIQUE INDEX IF NOT EXISTS idx_vehicle_images_primary_unique ON public.vehicle_images (vehicle_id) WHERE (is_primary = true);

-- 8. Drivers Table
CREATE TABLE IF NOT EXISTS public.drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_code TEXT NOT NULL UNIQUE DEFAULT public.generate_driver_code(),
    full_name TEXT NOT NULL,
    nic TEXT NOT NULL UNIQUE,
    date_of_birth DATE,
    mobile TEXT NOT NULL,
    whatsapp TEXT,
    email TEXT,
    address TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    license_number TEXT NOT NULL UNIQUE,
    license_expiry DATE,
    date_joined DATE,
    police_clearance_expiry DATE,
    medical_expiry DATE,
    status TEXT NOT NULL DEFAULT 'available',
    notes TEXT,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    archived_at TIMESTAMPTZ,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT check_driver_status CHECK (status IN ('available', 'assigned', 'on_leave', 'inactive'))
);

-- 9. Driver Documents Table
CREATE TABLE IF NOT EXISTS public.driver_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    public_url TEXT,
    file_name TEXT,
    expiry_date DATE,
    uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT check_document_type CHECK (document_type IN ('nic_front', 'nic_back', 'driving_license_front', 'driving_license_back', 'passport', 'police_clearance', 'medical_certificate', 'profile_photo', 'other'))
);

-- 10. Supabase Storage Buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('vehicle-images', 'vehicle-images', true),
  ('driver-documents', 'driver-documents', false)
ON CONFLICT (id) DO NOTHING;

-- 11. Updated At Triggers (Idempotent)
DROP TRIGGER IF EXISTS set_customers_updated_at ON public.customers;
CREATE TRIGGER set_customers_updated_at BEFORE UPDATE ON public.customers
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_customer_notes_updated_at ON public.customer_notes;
CREATE TRIGGER set_customer_notes_updated_at BEFORE UPDATE ON public.customer_notes
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_vehicle_categories_updated_at ON public.vehicle_categories;
CREATE TRIGGER set_vehicle_categories_updated_at BEFORE UPDATE ON public.vehicle_categories
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_vehicles_updated_at ON public.vehicles;
CREATE TRIGGER set_vehicles_updated_at BEFORE UPDATE ON public.vehicles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_drivers_updated_at ON public.drivers;
CREATE TRIGGER set_drivers_updated_at BEFORE UPDATE ON public.drivers
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 12. Indexes for Search & Filter Optimization
CREATE INDEX IF NOT EXISTS idx_customers_code ON public.customers (customer_code);
CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers (lower(full_name));
CREATE INDEX IF NOT EXISTS idx_customers_mobile ON public.customers (mobile);
CREATE INDEX IF NOT EXISTS idx_customers_whatsapp ON public.customers (whatsapp);
CREATE INDEX IF NOT EXISTS idx_customers_status ON public.customers (status);
CREATE INDEX IF NOT EXISTS idx_customers_archived ON public.customers (is_archived);

CREATE INDEX IF NOT EXISTS idx_vehicles_code ON public.vehicles (vehicle_code);
CREATE INDEX IF NOT EXISTS idx_vehicles_name ON public.vehicles (lower(vehicle_name));
CREATE INDEX IF NOT EXISTS idx_vehicles_brand ON public.vehicles (lower(brand));
CREATE INDEX IF NOT EXISTS idx_vehicles_model ON public.vehicles (lower(model));
CREATE INDEX IF NOT EXISTS idx_vehicles_reg ON public.vehicles (registration_number);
CREATE INDEX IF NOT EXISTS idx_vehicles_category ON public.vehicles (category_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON public.vehicles (status);
CREATE INDEX IF NOT EXISTS idx_vehicles_archived ON public.vehicles (is_archived);

CREATE INDEX IF NOT EXISTS idx_drivers_code ON public.drivers (driver_code);
CREATE INDEX IF NOT EXISTS idx_drivers_name ON public.drivers (lower(full_name));
CREATE INDEX IF NOT EXISTS idx_drivers_mobile ON public.drivers (mobile);
CREATE INDEX IF NOT EXISTS idx_drivers_nic ON public.drivers (nic);
CREATE INDEX IF NOT EXISTS idx_drivers_license ON public.drivers (license_number);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON public.drivers (status);
CREATE INDEX IF NOT EXISTS idx_drivers_archived ON public.drivers (is_archived);

CREATE INDEX IF NOT EXISTS idx_vehicle_images_vid ON public.vehicle_images (vehicle_id);
CREATE INDEX IF NOT EXISTS idx_driver_docs_did ON public.driver_documents (driver_id);
CREATE INDEX IF NOT EXISTS idx_customer_notes_cid ON public.customer_notes (customer_id);

-- 13. Enable RLS on Phase 2 Tables
ALTER TABLE public.vehicle_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_tag_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_documents ENABLE ROW LEVEL SECURITY;

-- 14. Non-Recursive RLS Policies for Phase 2 Tables

-- Vehicle Categories Policies
DROP POLICY IF EXISTS "Active users view categories" ON public.vehicle_categories;
CREATE POLICY "Active users view categories" ON public.vehicle_categories
    FOR SELECT USING (public.is_user_active(auth.uid()) = true);

DROP POLICY IF EXISTS "Manage categories" ON public.vehicle_categories;
CREATE POLICY "Manage categories" ON public.vehicle_categories
    FOR ALL USING (public.get_user_role(auth.uid()) IN ('owner', 'manager', 'operations_staff'));

-- Vehicles Policies
DROP POLICY IF EXISTS "Active users view vehicles" ON public.vehicles;
CREATE POLICY "Active users view vehicles" ON public.vehicles
    FOR SELECT USING (public.is_user_active(auth.uid()) = true);

DROP POLICY IF EXISTS "Operations manage vehicles" ON public.vehicles;
CREATE POLICY "Operations manage vehicles" ON public.vehicles
    FOR ALL USING (public.get_user_role(auth.uid()) IN ('owner', 'manager', 'operations_staff'));

-- Vehicle Images Policies
DROP POLICY IF EXISTS "Active users view vehicle images" ON public.vehicle_images;
CREATE POLICY "Active users view vehicle images" ON public.vehicle_images
    FOR SELECT USING (public.is_user_active(auth.uid()) = true);

DROP POLICY IF EXISTS "Operations manage vehicle images" ON public.vehicle_images;
CREATE POLICY "Operations manage vehicle images" ON public.vehicle_images
    FOR ALL USING (public.get_user_role(auth.uid()) IN ('owner', 'manager', 'operations_staff'));

-- Customers Policies
DROP POLICY IF EXISTS "Active users view customers" ON public.customers;
CREATE POLICY "Active users view customers" ON public.customers
    FOR SELECT USING (public.is_user_active(auth.uid()) = true);

DROP POLICY IF EXISTS "Staff manage customers" ON public.customers;
CREATE POLICY "Staff manage customers" ON public.customers
    FOR ALL USING (public.get_user_role(auth.uid()) IN ('owner', 'manager', 'booking_staff', 'operations_staff', 'finance_staff'));

-- Customer Tags Policies
DROP POLICY IF EXISTS "Active users view customer tags" ON public.customer_tags;
CREATE POLICY "Active users view customer tags" ON public.customer_tags
    FOR SELECT USING (public.is_user_active(auth.uid()) = true);

DROP POLICY IF EXISTS "Staff manage customer tags" ON public.customer_tags;
CREATE POLICY "Staff manage customer tags" ON public.customer_tags
    FOR ALL USING (public.get_user_role(auth.uid()) IN ('owner', 'manager', 'booking_staff'));

DROP POLICY IF EXISTS "Active users view tag assignments" ON public.customer_tag_assignments;
CREATE POLICY "Active users view tag assignments" ON public.customer_tag_assignments
    FOR SELECT USING (public.is_user_active(auth.uid()) = true);

DROP POLICY IF EXISTS "Staff manage tag assignments" ON public.customer_tag_assignments;
CREATE POLICY "Staff manage tag assignments" ON public.customer_tag_assignments
    FOR ALL USING (public.get_user_role(auth.uid()) IN ('owner', 'manager', 'booking_staff'));

-- Customer Notes Policies
DROP POLICY IF EXISTS "Active users view customer notes" ON public.customer_notes;
CREATE POLICY "Active users view customer notes" ON public.customer_notes
    FOR SELECT USING (public.is_user_active(auth.uid()) = true);

DROP POLICY IF EXISTS "Staff manage customer notes" ON public.customer_notes;
CREATE POLICY "Staff manage customer notes" ON public.customer_notes
    FOR ALL USING (public.is_user_active(auth.uid()) = true);

-- Drivers Policies
DROP POLICY IF EXISTS "Active users view drivers" ON public.drivers;
CREATE POLICY "Active users view drivers" ON public.drivers
    FOR SELECT USING (public.is_user_active(auth.uid()) = true);

DROP POLICY IF EXISTS "Operations manage drivers" ON public.drivers;
CREATE POLICY "Operations manage drivers" ON public.drivers
    FOR ALL USING (public.get_user_role(auth.uid()) IN ('owner', 'manager', 'operations_staff'));

-- Driver Documents Policies
DROP POLICY IF EXISTS "Authorized view driver docs" ON public.driver_documents;
CREATE POLICY "Authorized view driver docs" ON public.driver_documents
    FOR SELECT USING (public.get_user_role(auth.uid()) IN ('owner', 'manager', 'operations_staff'));

DROP POLICY IF EXISTS "Operations manage driver docs" ON public.driver_documents;
CREATE POLICY "Operations manage driver docs" ON public.driver_documents
    FOR ALL USING (public.get_user_role(auth.uid()) IN ('owner', 'manager', 'operations_staff'));
