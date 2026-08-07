-- Migration: 20260807070000_reminders_communications_upgrade.sql
-- Purpose: Stage 8 Reminders, Notifications & Communication Center Upgrade (Fresh-Database Safe)

-- 1. Reminders Table
CREATE TABLE IF NOT EXISTS public.reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reminder_number TEXT NOT NULL UNIQUE,
    reminder_type TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
    due_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'due', 'overdue', 'completed', 'dismissed', 'cancelled')),
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    source TEXT NOT NULL DEFAULT 'system' CHECK (source IN ('system', 'manual')),
    dedupe_key TEXT UNIQUE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    completed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    completed_at TIMESTAMPTZ,
    dismissed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    dismissed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. In-App Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
    is_read BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Communication Logs Table
CREATE TABLE IF NOT EXISTS public.communication_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'sms', 'email', 'phone', 'in_app')),
    recipient_type TEXT NOT NULL CHECK (recipient_type IN ('customer', 'lead', 'driver', 'staff', 'other')),
    recipient_id UUID,
    recipient_address TEXT NOT NULL,
    template_key TEXT,
    subject TEXT,
    message TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    status TEXT NOT NULL DEFAULT 'prepared' CHECK (status IN ('prepared', 'opened', 'sent', 'failed')),
    opened_at TIMESTAMPTZ,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 4. Communication Templates Table
CREATE TABLE IF NOT EXISTS public.communication_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_name TEXT NOT NULL,
    template_key TEXT NOT NULL UNIQUE,
    channel TEXT NOT NULL DEFAULT 'whatsapp',
    message_body TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed default communication templates safely
INSERT INTO public.communication_templates (template_name, template_key, channel, message_body)
VALUES
  ('Quotation Follow-up', 'quotation_followup', 'whatsapp', 'Hello {{CustomerName}}, following up on Quotation {{QuotationNumber}} (LKR {{Amount}}). Please let us know if you need any adjustments. - Thennakoon Tours'),
  ('Booking Confirmation', 'booking_confirmation', 'whatsapp', 'Hello {{CustomerName}}, your booking {{BookingNumber}} is confirmed for {{VehicleName}} ({{RegistrationNumber}}) from {{RentalStart}} to {{RentalEnd}}. - Thennakoon Tours'),
  ('Payment Reminder', 'payment_reminder', 'whatsapp', 'Hello {{CustomerName}}, this is a friendly reminder for Invoice {{InvoiceNumber}}. Outstanding Balance: LKR {{BalanceDue}} due on {{DueDate}}. - Thennakoon Tours'),
  ('Payment Receipt', 'payment_receipt', 'whatsapp', 'Hello {{CustomerName}}, payment received successfully. Receipt {{ReceiptNumber}} for LKR {{Amount}}. Thank you! - Thennakoon Tours'),
  ('Lead Follow-up', 'lead_followup', 'whatsapp', 'Hello {{CustomerName}}, following up on your Sri Lanka tour enquiry. How can we assist you with your trip planning? - Thennakoon Tours')
ON CONFLICT (template_key) DO NOTHING;

-- 5. Enable RLS
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reminders_policy" ON public.reminders;
CREATE POLICY "reminders_policy" ON public.reminders FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "notifications_policy" ON public.notifications;
CREATE POLICY "notifications_policy" ON public.notifications FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "communication_logs_policy" ON public.communication_logs;
CREATE POLICY "communication_logs_policy" ON public.communication_logs FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "communication_templates_policy" ON public.communication_templates;
CREATE POLICY "communication_templates_policy" ON public.communication_templates FOR ALL USING (auth.uid() IS NOT NULL);

-- 6. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_reminders_status_due ON public.reminders (status, due_at);
CREATE INDEX IF NOT EXISTS idx_reminders_assigned ON public.reminders (assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_reminders_entity ON public.reminders (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications (user_id, is_read, created_at);
CREATE INDEX IF NOT EXISTS idx_communication_logs_recipient ON public.communication_logs (recipient_type, recipient_id);
