-- Enable pgcrypto for UUID generation if needed
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create update_at trigger helper function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    avatar_url TEXT,
    phone TEXT,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT check_role_values CHECK (role IN ('owner', 'manager', 'booking_staff', 'operations_staff', 'marketing_staff', 'finance_staff', 'viewer'))
);

-- Index and unique constraint for active owners to prevent multiple active owners
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_owner ON public.profiles (role) WHERE (role = 'owner' AND is_active = true);

-- Create Company Settings Table
CREATE TABLE IF NOT EXISTS public.company_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL DEFAULT 'Thennakoon Tours (Pvt) Ltd',
    address TEXT,
    phone_primary TEXT,
    phone_secondary TEXT,
    whatsapp_number TEXT,
    email TEXT,
    website TEXT,
    quotation_prefix TEXT DEFAULT 'QT',
    invoice_prefix TEXT DEFAULT 'INV',
    receipt_prefix TEXT DEFAULT 'RCPT',
    currency TEXT DEFAULT 'LKR',
    timezone TEXT DEFAULT 'Asia/Colombo',
    document_letterhead_asset_path TEXT DEFAULT '/documents/thennakoon-tours-letterhead.png',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert Default Company Settings Row
INSERT INTO public.company_settings (id, company_name, address, phone_primary, phone_secondary, whatsapp_number, email, website, quotation_prefix, invoice_prefix, receipt_prefix, currency, timezone, document_letterhead_asset_path)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'Thennakoon Tours (Pvt) Ltd',
  '39 A, 1st Cross Street, Pagoda Road, Nugegoda',
  '+94 112 823 723',
  '+94 777 273 820',
  '+94 777 474 938',
  'info@thennakoontours.com',
  'thennakoontours.com',
  'QT',
  'INV',
  'RCPT',
  'LKR',
  'Asia/Colombo',
  '/documents/thennakoon-tours-letterhead.png'
) ON CONFLICT (id) DO NOTHING;

-- Auto-update triggers
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_company_settings_updated_at BEFORE UPDATE ON public.company_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user provisioning
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    is_first_user BOOLEAN;
    role_val TEXT;
    full_name_val TEXT;
BEGIN
    -- Check if this is the very first user in profiles
    SELECT NOT EXISTS (SELECT 1 FROM public.profiles) INTO is_first_user;

    full_name_val := COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
    
    IF is_first_user THEN
        role_val := 'owner';
    ELSE
        role_val := COALESCE(new.raw_user_meta_data->>'role', 'viewer');
    END IF;

    INSERT INTO public.profiles (id, full_name, email, role, is_active, avatar_url, phone)
    VALUES (
        new.id,
        full_name_val,
        new.email,
        role_val,
        true,
        new.raw_user_meta_data->>'avatar_url',
        new.raw_user_meta_data->>'phone'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for auth.users insertion
CREATE OR REPLACE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger function for profiles updates/deletes to enforce safety constraints
CREATE OR REPLACE FUNCTION public.check_profile_changes()
RETURNS TRIGGER AS $$
DECLARE
    current_user_role TEXT;
BEGIN
    -- Get the role of the user making the request (from the profiles table)
    SELECT role INTO current_user_role FROM public.profiles WHERE id = auth.uid();

    -- 1. Prevent owner from being deleted
    IF TG_OP = 'DELETE' THEN
        IF OLD.role = 'owner' THEN
            RAISE EXCEPTION 'The owner account cannot be deleted.';
        END IF;
        RETURN OLD;
    END IF;

    -- 2. Prevent Owner from demoting themselves or deactivating themselves
    IF OLD.role = 'owner' THEN
        IF NEW.role != 'owner' THEN
            RAISE EXCEPTION 'The owner account cannot be demoted to another role.';
        END IF;
        IF NEW.is_active = false THEN
            RAISE EXCEPTION 'The owner account cannot be deactivated.';
        END IF;
    END IF;

    -- 3. Prevent non-owners from changing anyone's role, is_active status, or editing other profiles
    IF auth.uid() IS NOT NULL AND (current_user_role IS NULL OR current_user_role != 'owner') THEN
        -- Non-owners cannot change anyone's role (including their own)
        IF OLD.role != NEW.role THEN
            RAISE EXCEPTION 'Only the owner can modify user roles.';
        END IF;
        -- Non-owners cannot change is_active status of any user (including themselves)
        IF OLD.is_active != NEW.is_active THEN
            RAISE EXCEPTION 'Only the owner can activate or deactivate accounts.';
        END IF;
        -- Non-owners can only update their own profile
        IF OLD.id != auth.uid() THEN
            RAISE EXCEPTION 'You do not have permission to update this profile.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Bind safety trigger
CREATE TRIGGER trigger_check_profile_changes
BEFORE UPDATE OR DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.check_profile_changes();

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view their own profile or owner can view all" ON public.profiles
    FOR SELECT
    USING (auth.uid() = id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'owner');

CREATE POLICY "Users can update their own profile fields except role/active, owner can update all" ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'owner');

CREATE POLICY "Only owner can delete profiles" ON public.profiles
    FOR DELETE
    USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'owner');

-- Company Settings Policies
CREATE POLICY "All active users can view company settings" ON public.company_settings
    FOR SELECT
    USING ((SELECT is_active FROM public.profiles WHERE id = auth.uid()) = true);

CREATE POLICY "Only owner can update company settings" ON public.company_settings
    FOR UPDATE
    USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'owner');

-- Audit Logs Policies
CREATE POLICY "Only owner can view audit logs" ON public.audit_logs
    FOR SELECT
    USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'owner');

CREATE POLICY "Active users can insert audit logs" ON public.audit_logs
    FOR INSERT
    WITH CHECK ((SELECT is_active FROM public.profiles WHERE id = auth.uid()) = true);

-- SECURITY DEFINER Helper Functions
CREATE OR REPLACE FUNCTION public.check_owner_exists()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM public.profiles WHERE role = 'owner' AND is_active = true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_role TEXT;
BEGIN
    SELECT role INTO v_role FROM public.profiles WHERE id = p_user_id;
    RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_user_active(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_active BOOLEAN;
BEGIN
    SELECT is_active INTO v_active FROM public.profiles WHERE id = p_user_id;
    RETURN COALESCE(v_active, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.update_last_login(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.profiles
    SET last_login_at = now()
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.log_audit_action_internal(
    p_action TEXT,
    p_entity_type TEXT,
    p_entity_id UUID,
    p_description TEXT,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, description, metadata)
    VALUES (auth.uid(), p_action, p_entity_type, p_entity_id, p_description, p_metadata);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
