-- Migration: Update default_invoice_terms in company_settings to official Thennakoon Tours text
ALTER TABLE public.company_settings 
  ALTER COLUMN default_invoice_terms 
  SET DEFAULT 'Please find the account details below. Kindly ensure the payment is made on or before the due date to the mentioned account.
Once the payment is done, please WhatsApp the payment slip to +94 760080155 and mention the vehicle registration number as the reference.';

UPDATE public.company_settings
SET default_invoice_terms = 'Please find the account details below. Kindly ensure the payment is made on or before the due date to the mentioned account.
Once the payment is done, please WhatsApp the payment slip to +94 760080155 and mention the vehicle registration number as the reference.'
WHERE default_invoice_terms IS NULL 
   OR default_invoice_terms LIKE '%Payment due upon receipt%';
