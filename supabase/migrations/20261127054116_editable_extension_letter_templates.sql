-- Migration: 20261127054116_editable_extension_letter_templates.sql
-- Purpose: Add support for user_extension_letter and owner_extension_letter in document_templates,
--          add immutable snapshot columns on agreement_extensions, and seed default extension letter templates.

-- 1. Extend document_templates CHECK constraint for extension letter types
ALTER TABLE public.document_templates
  DROP CONSTRAINT IF EXISTS document_templates_document_type_check;

ALTER TABLE public.document_templates
  ADD CONSTRAINT document_templates_document_type_check
  CHECK (
    document_type IN (
      'quotation',
      'invoice',
      'receipt',
      'rental_agreement',
      'user_agreement',
      'owner_agreement',
      'user_extension_letter',
      'owner_extension_letter'
    )
  );

-- 2. Add immutable snapshot columns on agreement_extensions
ALTER TABLE public.agreement_extensions
  ADD COLUMN IF NOT EXISTS rendered_content_snapshot TEXT;

ALTER TABLE public.agreement_extensions
  ADD COLUMN IF NOT EXISTS rendered_sections_snapshot JSONB;

-- 3. Seed default User Extension Letter template
INSERT INTO public.document_templates (
  document_type,
  template_type,
  display_name,
  title,
  body_content,
  sections_json,
  special_notes,
  is_active
)
VALUES (
  'user_extension_letter',
  'user_extension_letter',
  'User Extension Letter Template',
  'Master Customer Rental Extension Letter',
  $uext$### Header, Recipient & Subject

Ref: {{extension_number}} | Date: {{issue_date}}

To: **{{recipient_name}}**

# RE: EXTENSION OF VEHICLE RENTAL AGREEMENT – VEHICLE NO: {{vehicle_reg_no}}

### Salutation & Confirmation

Dear {{recipient_name}},

We are pleased to confirm the extension of your vehicle rental agreement with **Thennakoon Tours (Pvt) Ltd** for the vehicle bearing registration number **{{vehicle_reg_no}}** (originally commenced under Agreement No. **{{original_agreement_ref}}**).

### Extension Period & Renewal Charges

By mutual consent, the rental period is hereby extended for **{{extension_duration_label}}** (Revised End Date: **{{new_end_date}}**).

Agreed Renewal / Periodic Rental Charge: **{{currency}} {{renewal_amount}}**

### Continuity of Terms & Acknowledgement

All other terms, conditions, security deposit provisions, insurance obligations, and covenants stated in the original Vehicle Rental Agreement shall remain unchanged and continue in full force and effect during this extended period.

**Additional Notes / Agreed Terms:** {{custom_notes}}

Kindly sign and return a copy of this letter as your formal acknowledgment and acceptance of this extension.$uext$,
  '[
    {"id":"sec_ext_user_header","order":1,"title":"Header, Recipient & Subject","body":"Ref: {{extension_number}} | Date: {{issue_date}}\n\nTo: **{{recipient_name}}**\n\n# RE: EXTENSION OF VEHICLE RENTAL AGREEMENT – VEHICLE NO: {{vehicle_reg_no}}"},
    {"id":"sec_ext_user_opening","order":2,"title":"Salutation & Confirmation","body":"Dear {{recipient_name}},\n\nWe are pleased to confirm the extension of your vehicle rental agreement with **Thennakoon Tours (Pvt) Ltd** for the vehicle bearing registration number **{{vehicle_reg_no}}** (originally commenced under Agreement No. **{{original_agreement_ref}}**)."},
    {"id":"sec_ext_user_terms","order":3,"title":"Extension Period & Renewal Charges","body":"By mutual consent, the rental period is hereby extended for **{{extension_duration_label}}** (Revised End Date: **{{new_end_date}}**).\n\nAgreed Renewal / Periodic Rental Charge: **{{currency}} {{renewal_amount}}**"},
    {"id":"sec_ext_user_closing","order":4,"title":"Continuity of Terms & Acknowledgement","body":"All other terms, conditions, security deposit provisions, insurance obligations, and covenants stated in the original Vehicle Rental Agreement shall remain unchanged and continue in full force and effect during this extended period.\n\n**Additional Notes / Agreed Terms:** {{custom_notes}}\n\nKindly sign and return a copy of this letter as your formal acknowledgment and acceptance of this extension."}
  ]'::jsonb,
  'Official customer rental agreement extension letter template with dynamic merge tags.',
  true
)
ON CONFLICT (document_type) DO NOTHING;

-- 4. Seed default Owner Extension Letter template
INSERT INTO public.document_templates (
  document_type,
  template_type,
  display_name,
  title,
  body_content,
  sections_json,
  special_notes,
  is_active
)
VALUES (
  'owner_extension_letter',
  'owner_extension_letter',
  'Owner Extension Letter Template',
  'Master Vehicle Owner Extension Letter',
  $oext$### Header, Owner & Subject

Ref: {{extension_number}} | Date: {{issue_date}}

To: **{{recipient_name}}**

# RE: EXTENSION OF VEHICLE OWNER AGREEMENT – VEHICLE NO: {{vehicle_reg_no}}

### Salutation & Confirmation

Dear {{recipient_name}},

This letter formally confirms the mutual extension of the Vehicle Owner Agreement between **Thennakoon Tours (Pvt) Ltd** and **{{recipient_name}}** regarding the vehicle bearing registration number **{{vehicle_reg_no}}** (Reference Agreement No. **{{original_agreement_ref}}**).

### Extension Period & Owner Rental Amount

Both parties have mutually agreed to extend the operational engagement of the above vehicle for **{{extension_duration_label}}** (Revised End Date: **{{new_end_date}}**).

Agreed Monthly Owner Rental Amount: **{{currency}} {{renewal_amount}}**

### Continuity of Terms & Acknowledgement

All original terms, conditions, revenue-share / monthly payment schedules, mileage limits, and maintenance responsibilities set out in the principal Vehicle Owner Agreement shall remain binding throughout the extended tenure.

**Special Notes:** {{custom_notes}}

Kindly sign and return a copy of this letter as your formal acknowledgment and acceptance of this extension.$oext$,
  '[
    {"id":"sec_ext_owner_header","order":1,"title":"Header, Owner & Subject","body":"Ref: {{extension_number}} | Date: {{issue_date}}\n\nTo: **{{recipient_name}}**\n\n# RE: EXTENSION OF VEHICLE OWNER AGREEMENT – VEHICLE NO: {{vehicle_reg_no}}"},
    {"id":"sec_ext_owner_opening","order":2,"title":"Salutation & Confirmation","body":"Dear {{recipient_name}},\n\nThis letter formally confirms the mutual extension of the Vehicle Owner Agreement between **Thennakoon Tours (Pvt) Ltd** and **{{recipient_name}}** regarding the vehicle bearing registration number **{{vehicle_reg_no}}** (Reference Agreement No. **{{original_agreement_ref}}**)."},
    {"id":"sec_ext_owner_terms","order":3,"title":"Extension Period & Owner Rental Amount","body":"Both parties have mutually agreed to extend the operational engagement of the above vehicle for **{{extension_duration_label}}** (Revised End Date: **{{new_end_date}}**).\n\nAgreed Monthly Owner Rental Amount: **{{currency}} {{renewal_amount}}**"},
    {"id":"sec_ext_owner_closing","order":4,"title":"Continuity of Terms & Acknowledgement","body":"All original terms, conditions, revenue-share / monthly payment schedules, mileage limits, and maintenance responsibilities set out in the principal Vehicle Owner Agreement shall remain binding throughout the extended tenure.\n\n**Special Notes:** {{custom_notes}}\n\nKindly sign and return a copy of this letter as your formal acknowledgment and acceptance of this extension."}
  ]'::jsonb,
  'Official vehicle owner agreement extension letter template with dynamic merge tags.',
  true
)
ON CONFLICT (document_type) DO NOTHING;
