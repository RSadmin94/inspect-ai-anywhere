-- Drop the existing restrictive policy (it doesn't work without a permissive policy)
DROP POLICY IF EXISTS "Service role only" ON public.licenses;

-- Create a PERMISSIVE policy that denies all direct access
-- The service role bypasses RLS, so edge functions still work
CREATE POLICY "Deny all direct access"
ON public.licenses
FOR ALL
TO public
USING (false)
WITH CHECK (false);

-- Also secure the license_devices table
ALTER TABLE public.license_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny all direct access"
ON public.license_devices
FOR ALL
TO public
USING (false)
WITH CHECK (false);