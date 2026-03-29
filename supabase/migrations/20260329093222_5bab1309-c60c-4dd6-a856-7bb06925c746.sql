
-- Family contacts linked to map locations
CREATE TABLE public.family_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  relationship text,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  address text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.family_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to family_contacts" ON public.family_contacts FOR ALL USING (true) WITH CHECK (true);

-- Medical records filled by caregiver
CREATE TABLE public.medical_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to medical_records" ON public.medical_records FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime for self_reminders so caregiver sees patient notes
ALTER PUBLICATION supabase_realtime ADD TABLE public.self_reminders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.family_contacts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.medical_records;
