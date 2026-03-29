
CREATE TABLE public.media_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_type text NOT NULL DEFAULT 'photo',
  status text NOT NULL DEFAULT 'requested',
  media_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  fulfilled_at timestamp with time zone
);

ALTER TABLE public.media_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to media_requests" ON public.media_requests FOR ALL TO public USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.media_requests;

INSERT INTO storage.buckets (id, name, public) VALUES ('media-captures', 'media-captures', true);

CREATE POLICY "Allow all uploads to media-captures" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'media-captures');
CREATE POLICY "Allow all reads from media-captures" ON storage.objects FOR SELECT TO public USING (bucket_id = 'media-captures');
