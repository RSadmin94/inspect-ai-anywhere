-- Add security documentation comments
COMMENT ON TABLE public.licenses IS 'SECURITY: Access restricted to service_role only via Edge Functions. Client access explicitly denied by RLS.';
COMMENT ON TABLE public.license_devices IS 'SECURITY: Access restricted to service_role only via Edge Functions. Client access explicitly denied by RLS.';