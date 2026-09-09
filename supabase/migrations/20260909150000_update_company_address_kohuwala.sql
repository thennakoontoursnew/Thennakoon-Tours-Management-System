-- Migration: 20260909150000_update_company_address_kohuwala.sql
-- Purpose: Update company settings default address and contact details to Kohuwala

UPDATE company_settings
SET address = 'No. 146/5A, Dutugemunu Street, Caldera Gardens, Kohuwala.',
    email = 'info@thennakoontours.com',
    website = 'thennakoontours.com',
    phone_primary = '+94 112 823 723',
    phone_secondary = '+94 777 273 820',
    whatsapp_number = '+94 777 474 938',
    default_agreement_location = 'Kohuwala, Sri Lanka';
