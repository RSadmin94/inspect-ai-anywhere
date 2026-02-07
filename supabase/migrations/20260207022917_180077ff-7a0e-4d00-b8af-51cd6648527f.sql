-- License device activation tracking for Gumroad licensing
CREATE TABLE public.license_devices (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  license_hash text NOT NULL,
  device_id text NOT NULL,
  activated_at timestamptz DEFAULT now(),
  last_seen_at timestamptz DEFAULT now(),
  CONSTRAINT license_devices_unique UNIQUE (license_hash, device_id)
);

-- Index for efficient lookup by license hash
CREATE INDEX idx_license_devices_license_hash ON public.license_devices (license_hash);

-- Enable RLS but allow public access through edge function only
ALTER TABLE public.license_devices ENABLE ROW LEVEL SECURITY;

-- No direct public access - all access through edge function
-- Edge function uses service role key