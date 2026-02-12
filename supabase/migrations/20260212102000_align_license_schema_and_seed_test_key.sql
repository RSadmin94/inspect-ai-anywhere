-- Production hardening for 365 InspectAI license verification.
-- Ensures canonical schema columns exist, keeps legacy columns compatible,
-- enforces RLS deny policies for anon/authenticated, and seeds the test key.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create required table if migrations were never applied.
CREATE TABLE IF NOT EXISTS public.licenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "key" text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'active',
  device_limit integer NOT NULL DEFAULT 2,
  expires_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  product_id text NOT NULL DEFAULT 'inspectai_pro',
  license_key text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  max_devices integer NOT NULL DEFAULT 2,
  customer_name text,
  email text,
  notes text,
  last_reset_at timestamptz NULL,
  reset_count integer NOT NULL DEFAULT 0,
  allow_ai boolean NOT NULL DEFAULT true
);

-- Ensure required columns exist on existing tables.
ALTER TABLE public.licenses
  ADD COLUMN IF NOT EXISTS "key" text,
  ADD COLUMN IF NOT EXISTS status text,
  ADD COLUMN IF NOT EXISTS device_limit integer,
  ADD COLUMN IF NOT EXISTS license_key text,
  ADD COLUMN IF NOT EXISTS is_active boolean,
  ADD COLUMN IF NOT EXISTS max_devices integer,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_at timestamptz,
  ADD COLUMN IF NOT EXISTS product_id text,
  ADD COLUMN IF NOT EXISTS customer_name text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS last_reset_at timestamptz,
  ADD COLUMN IF NOT EXISTS reset_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS allow_ai boolean NOT NULL DEFAULT true;

-- Migrate legacy bigint PK to UUID PK when needed.
DO $$
DECLARE
  id_data_type text;
BEGIN
  SELECT data_type
    INTO id_data_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'licenses'
    AND column_name = 'id';

  IF id_data_type IS NULL THEN
    ALTER TABLE public.licenses
      ADD COLUMN id uuid DEFAULT gen_random_uuid();
  ELSIF id_data_type <> 'uuid' THEN
    ALTER TABLE public.licenses
      ADD COLUMN IF NOT EXISTS id_uuid uuid DEFAULT gen_random_uuid();

    UPDATE public.licenses
      SET id_uuid = COALESCE(id_uuid, gen_random_uuid());

    ALTER TABLE public.licenses
      ALTER COLUMN id_uuid SET NOT NULL;

    ALTER TABLE public.licenses
      DROP CONSTRAINT IF EXISTS licenses_pkey;

    ALTER TABLE public.licenses
      DROP COLUMN id;

    ALTER TABLE public.licenses
      RENAME COLUMN id_uuid TO id;
  END IF;

  BEGIN
    ALTER TABLE public.licenses
      ADD CONSTRAINT licenses_pkey PRIMARY KEY (id);
  EXCEPTION
    WHEN duplicate_table OR duplicate_object THEN
      NULL;
  END;
END $$;

-- Backfill canonical fields from legacy fields.
UPDATE public.licenses
SET
  "key" = COALESCE("key", license_key),
  status = COALESCE(status, CASE WHEN is_active THEN 'active' ELSE 'inactive' END),
  device_limit = COALESCE(device_limit, max_devices, 2),
  created_at = COALESCE(created_at, now());

-- Backfill legacy fields from canonical fields.
UPDATE public.licenses
SET
  license_key = COALESCE(license_key, "key"),
  is_active = COALESCE(is_active, lower(status) = 'active'),
  max_devices = COALESCE(max_devices, device_limit, 2),
  product_id = COALESCE(product_id, 'inspectai_pro');

ALTER TABLE public.licenses
  ALTER COLUMN "key" SET NOT NULL,
  ALTER COLUMN status SET NOT NULL,
  ALTER COLUMN device_limit SET NOT NULL,
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN status SET DEFAULT 'active',
  ALTER COLUMN device_limit SET DEFAULT 2,
  ALTER COLUMN license_key SET NOT NULL,
  ALTER COLUMN is_active SET NOT NULL,
  ALTER COLUMN max_devices SET NOT NULL,
  ALTER COLUMN product_id SET DEFAULT 'inspectai_pro',
  ALTER COLUMN reset_count SET DEFAULT 0,
  ALTER COLUMN allow_ai SET DEFAULT true;

CREATE UNIQUE INDEX IF NOT EXISTS idx_licenses_key_unique
  ON public.licenses ("key");

CREATE UNIQUE INDEX IF NOT EXISTS idx_licenses_license_key_unique
  ON public.licenses (license_key);

CREATE INDEX IF NOT EXISTS idx_licenses_status
  ON public.licenses (status);

-- Keep canonical and legacy columns synchronized for compatibility.
CREATE OR REPLACE FUNCTION public.sync_licenses_compat_columns()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW."key" := COALESCE(NEW."key", NEW.license_key);
    NEW.license_key := COALESCE(NEW.license_key, NEW."key");

    NEW.status := COALESCE(
      NEW.status,
      CASE
        WHEN NEW.is_active IS NULL THEN NULL
        WHEN NEW.is_active THEN 'active'
        ELSE 'inactive'
      END,
      'inactive'
    );

    IF NEW.is_active IS NULL THEN
      NEW.is_active := lower(NEW.status) = 'active';
    END IF;

    NEW.device_limit := COALESCE(NEW.device_limit, NEW.max_devices, 2);
    NEW.max_devices := COALESCE(NEW.max_devices, NEW.device_limit, 2);
  ELSE
    IF NEW."key" IS DISTINCT FROM OLD."key" THEN
      NEW.license_key := NEW."key";
    ELSIF NEW.license_key IS DISTINCT FROM OLD.license_key THEN
      NEW."key" := NEW.license_key;
    ELSE
      NEW."key" := COALESCE(NEW."key", NEW.license_key, OLD."key");
      NEW.license_key := COALESCE(NEW.license_key, NEW."key", OLD.license_key);
    END IF;

    IF NEW.status IS DISTINCT FROM OLD.status THEN
      NEW.is_active := lower(COALESCE(NEW.status, 'inactive')) = 'active';
    ELSIF NEW.is_active IS DISTINCT FROM OLD.is_active THEN
      NEW.status := CASE WHEN COALESCE(NEW.is_active, false) THEN 'active' ELSE 'inactive' END;
    ELSE
      NEW.status := COALESCE(NEW.status, CASE WHEN COALESCE(NEW.is_active, false) THEN 'active' ELSE 'inactive' END);
      NEW.is_active := COALESCE(NEW.is_active, lower(NEW.status) = 'active');
    END IF;

    IF NEW.device_limit IS DISTINCT FROM OLD.device_limit THEN
      NEW.max_devices := NEW.device_limit;
    ELSIF NEW.max_devices IS DISTINCT FROM OLD.max_devices THEN
      NEW.device_limit := NEW.max_devices;
    ELSE
      NEW.device_limit := COALESCE(NEW.device_limit, NEW.max_devices, OLD.device_limit, 2);
      NEW.max_devices := COALESCE(NEW.max_devices, NEW.device_limit, OLD.max_devices, 2);
    END IF;
  END IF;

  NEW.created_at := COALESCE(NEW.created_at, now());
  NEW.reset_count := COALESCE(NEW.reset_count, 0);
  NEW.allow_ai := COALESCE(NEW.allow_ai, true);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_licenses_compat_columns ON public.licenses;
CREATE TRIGGER trg_sync_licenses_compat_columns
BEFORE INSERT OR UPDATE ON public.licenses
FOR EACH ROW EXECUTE FUNCTION public.sync_licenses_compat_columns();

-- Ensure device tracking table exists.
CREATE TABLE IF NOT EXISTS public.license_devices (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  license_hash text NOT NULL,
  device_id text NOT NULL,
  activated_at timestamptz DEFAULT now(),
  last_seen_at timestamptz DEFAULT now(),
  CONSTRAINT license_devices_unique UNIQUE (license_hash, device_id)
);

CREATE INDEX IF NOT EXISTS idx_license_devices_license_hash
  ON public.license_devices (license_hash);

-- Enforce strict RLS deny policies for client roles.
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_devices ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  p record;
BEGIN
  FOR p IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'licenses'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.licenses', p.policyname);
  END LOOP;
END $$;

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

DO $$
DECLARE
  p record;
BEGIN
  FOR p IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'license_devices'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.license_devices', p.policyname);
  END LOOP;
END $$;

CREATE POLICY license_devices_deny_anon
ON public.license_devices
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

CREATE POLICY license_devices_deny_authenticated
ON public.license_devices
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

-- Service role bypasses RLS. Upsert production validation key.
UPDATE public.licenses
SET
  "key" = 'TEST-365INSPECTAI-2026',
  status = 'active',
  device_limit = 3,
  expires_at = '2027-01-01T00:00:00Z'::timestamptz,
  created_at = now(),
  license_key = 'TEST-365INSPECTAI-2026',
  is_active = true,
  max_devices = 3,
  allow_ai = true
WHERE "key" = 'TEST-365INSPECTAI-2026'
   OR license_key = 'TEST-365INSPECTAI-2026';

INSERT INTO public.licenses (
  "key",
  status,
  device_limit,
  expires_at,
  created_at,
  license_key,
  is_active,
  max_devices,
  allow_ai,
  product_id
)
SELECT
  'TEST-365INSPECTAI-2026',
  'active',
  3,
  '2027-01-01T00:00:00Z'::timestamptz,
  now(),
  'TEST-365INSPECTAI-2026',
  true,
  3,
  true,
  'inspectai_pro'
WHERE NOT EXISTS (
  SELECT 1
  FROM public.licenses
  WHERE "key" = 'TEST-365INSPECTAI-2026'
     OR license_key = 'TEST-365INSPECTAI-2026'
);
