-- Insert dedicated test license key for 365 InspectAI QA
INSERT INTO public.licenses (
  license_key,
  product_id,
  customer_name,
  email,
  max_devices,
  is_active,
  notes
)
VALUES (
  'TEST-365INSPECTAI-2026',
  'inspectai_pro',
  '365 InspectAI QA',
  'qa@365globalsolutions.com',
  2,
  true,
  'Dedicated test license key for 365inspectai validation'
)
ON CONFLICT (license_key) DO NOTHING;
