-- Enable Row Level Security on global_settings table
ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "read_global_settings_public" ON public.global_settings
  FOR SELECT TO anon USING (true);

-- Optional: Add policy for authenticated users if needed
-- CREATE POLICY "read_global_settings_authenticated" ON public.global_settings
--   FOR SELECT TO authenticated USING (true);

-- Optional: Add policy for service role (admin) if needed
-- CREATE POLICY "admin_global_settings" ON public.global_settings
--   FOR ALL TO service_role USING (true);
