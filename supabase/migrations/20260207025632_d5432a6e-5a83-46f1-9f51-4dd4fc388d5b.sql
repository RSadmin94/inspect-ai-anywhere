-- Add reset cooldown tracking columns to licenses table
ALTER TABLE public.licenses 
ADD COLUMN IF NOT EXISTS last_reset_at timestamptz NULL,
ADD COLUMN IF NOT EXISTS reset_count integer NOT NULL DEFAULT 0;