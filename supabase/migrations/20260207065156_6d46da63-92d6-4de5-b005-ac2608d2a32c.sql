-- Insert test license keys for QA
-- These are for testing purposes only

INSERT INTO public.licenses (license_key, product_id, customer_name, email, max_devices, is_active, notes)
VALUES 
  ('TEST-QA-001-ACTIVE', 'inspectai_pro', 'QA Tester 1', 'qa1@test.com', 2, true, 'QA test key - active'),
  ('TEST-QA-002-ACTIVE', 'inspectai_pro', 'QA Tester 2', 'qa2@test.com', 3, true, 'QA test key - 3 devices'),
  ('DEMO-TRIAL-KEY-2025', 'inspectai_pro', 'Demo User', 'demo@365globalsolutions.com', 2, true, 'Demo/trial key for presentations')
ON CONFLICT (license_key) DO NOTHING;