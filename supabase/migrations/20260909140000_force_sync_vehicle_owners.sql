-- Migration: 20260909140000_force_sync_vehicle_owners.sql
-- Purpose: Force sync missing vehicle owners from vehicles table and link vehicle_owner_id

-- Auto-create missing owners from vehicles where owner_contact_name is populated
INSERT INTO vehicle_owners (
  owner_number,
  full_name,
  mobile,
  whatsapp,
  is_active,
  notes
)
SELECT DISTINCT
  'OWN-2026-' || LPAD(FLOOR(RANDOM() * 900000 + 100000)::TEXT, 6, '0'),
  TRIM(v.owner_contact_name),
  NULLIF(TRIM(v.owner_contact_phone), ''),
  NULLIF(TRIM(v.owner_contact_phone), ''),
  true,
  'Auto-synced from fleet vehicles'
FROM vehicles v
WHERE v.owner_contact_name IS NOT NULL
  AND TRIM(v.owner_contact_name) <> ''
  AND NOT EXISTS (
    SELECT 1 FROM vehicle_owners vo 
    WHERE LOWER(TRIM(vo.full_name)) = LOWER(TRIM(v.owner_contact_name))
  );

-- Link vehicles to the vehicle_owners table
UPDATE vehicles v
SET vehicle_owner_id = vo.id
FROM vehicle_owners vo
WHERE LOWER(TRIM(v.owner_contact_name)) = LOWER(TRIM(vo.full_name))
  AND v.vehicle_owner_id IS NULL;
