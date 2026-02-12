-- Align production licenses schema with verify endpoint expectations.
-- Keeps migration idempotent and safe for legacy environments.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.licenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "key" text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'active',
  device_limit integer NOT NULL DEFAULT 1,
  expires_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  license_key text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  max_devices integer NOT NULL DEFAULT 1,
  product_id text NOT NULL DEFAULT 'inspectai_pro',
  allow_ai boolean NOT NULL DEFAULT true,
  last_reset_at timestamptz NULL,
  reset_count integer NOT NULL DEFAULT 0
);

ALTER TABLE public.licenses
  ADD COLUMN IF NOT EXISTS "key" text,
  ADD COLUMN IF NOT EXISTS status text,
  ADD COLUMN IF NOT EXISTS device_limit integer,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_at timestamptz,
  ADD COLUMN IF NOT EXISTS license_key text,
  ADD COLUMN IF NOT EXISTS is_active boolean,
  ADD COLUMN IF NOT EXISTS max_devices integer,
  ADD COLUMN IF NOT EXISTS product_id text,
  ADD COLUMN IF NOT EXISTS allow_ai boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_reset_at timestamptz,
  ADD COLUMN IF NOT EXISTS reset_count integer DEFAULT 0;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'licenses'
      AND column_name = 'license_key'
  ) THEN
    EXECUTE 'UPDATE public.licenses SET "key" = COALESCE("key", license_key)';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'licenses'
      AND column_name = 'is_active'
  ) THEN
    EXECUTE 'UPDATE public.licenses SET status = COALESCE(status, CASE WHEN is_active THEN ''active'' ELSE ''inactive'' END)';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'licenses'
      AND column_name = 'max_devices'
  ) THEN
    EXECUTE 'UPDATE public.licenses SET device_limit = COALESCE(device_limit, max_devices)';
  END IF;
END $$;

UPDATE public.licenses
SET
  "key" = COALESCE("key", license_key),
  status = COALESCE(status, 'active'),
  device_limit = COALESCE(device_limit, 1),
  license_key = COALESCE(license_key, "key"),
  is_active = COALESCE(is_active, lower(status) = 'active'),
  max_devices = COALESCE(max_devices, device_limit, 1),
  product_id = COALESCE(product_id, 'inspectai_pro'),
  allow_ai = COALESCE(allow_ai, true),
  reset_count = COALESCE(reset_count, 0),
  created_at = COALESCE(created_at, now())
WHERE "key" IS NULL
   OR status IS NULL
   OR device_limit IS NULL
   OR license_key IS NULL
   OR is_active IS NULL
   OR max_devices IS NULL
   OR product_id IS NULL
   OR allow_ai IS NULL
   OR reset_count IS NULL
   OR created_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_licenses_key_unique
  ON public.licenses ("key");

CREATE UNIQUE INDEX IF NOT EXISTS idx_licenses_license_key_unique
  ON public.licenses (license_key);

ALTER TABLE public.licenses
  ALTER COLUMN "key" SET NOT NULL,
  ALTER COLUMN status SET NOT NULL,
  ALTER COLUMN device_limit SET NOT NULL,
  ALTER COLUMN created_at SET NOT NULL;

ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS licenses_deny_anon ON public.licenses;
DROP POLICY IF EXISTS licenses_deny_authenticated ON public.licenses;

CREATE POLICY licenses_deny_anon
ON public.licenses
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

CREATE POLICY licenses_deny_authenticated
ON public.licenses
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);
