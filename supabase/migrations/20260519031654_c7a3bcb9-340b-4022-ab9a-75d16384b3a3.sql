
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licenses FORCE ROW LEVEL SECURITY;
ALTER TABLE public.license_devices FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Deny all direct access" ON public.licenses;
DROP POLICY IF EXISTS "Deny all direct access" ON public.license_devices;

CREATE POLICY "Block all client access to licenses"
  ON public.licenses
  AS RESTRICTIVE
  FOR ALL
  TO public, anon, authenticated
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Block all client access to license_devices"
  ON public.license_devices
  AS RESTRICTIVE
  FOR ALL
  TO public, anon, authenticated
  USING (false)
  WITH CHECK (false);

REVOKE ALL ON public.licenses FROM anon, authenticated;
REVOKE ALL ON public.license_devices FROM anon, authenticated;
