-- Create licenses table to store valid license keys
CREATE TABLE public.licenses (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  license_key text NOT NULL UNIQUE,
  product_id text NOT NULL DEFAULT 'inspectai-pro',
  email text,
  customer_name text,
  is_active boolean NOT NULL DEFAULT true,
  max_devices integer NOT NULL DEFAULT 2,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  notes text
);

-- Index for fast license key lookups
CREATE INDEX idx_licenses_key ON public.licenses (license_key);
CREATE INDEX idx_licenses_product ON public.licenses (product_id);

-- Enable RLS
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;

-- Only service role can access licenses table (edge function uses service role)
CREATE POLICY "Service role only" ON public.licenses
  FOR ALL USING (false);
