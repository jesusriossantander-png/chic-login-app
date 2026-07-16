-- Fleet management
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  internal_number TEXT,
  license_plate TEXT NOT NULL,
  vehicle_type TEXT NOT NULL DEFAULT 'Camión',
  brand TEXT,
  model TEXT,
  vehicle_year INTEGER,
  color TEXT,
  mileage INTEGER,
  driver_name TEXT,
  driver_document TEXT,
  driver_license TEXT,
  driver_license_expiry DATE,
  notes TEXT,
  photo_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicles TO authenticated;
GRANT ALL ON public.vehicles TO service_role;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own vehicles all" ON public.vehicles FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER vehicles_updated_at BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX vehicles_user_idx ON public.vehicles(user_id, license_plate);

CREATE TABLE public.vehicle_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL UNIQUE,
  expiry_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicle_documents TO authenticated;
GRANT ALL ON public.vehicle_documents TO service_role;
ALTER TABLE public.vehicle_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own vehicle documents all" ON public.vehicle_documents FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX vehicle_documents_vehicle_idx ON public.vehicle_documents(vehicle_id, created_at DESC);

INSERT INTO storage.buckets (id, name, public)
VALUES ('vehicle-files', 'vehicle-files', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "own vehicle files select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'vehicle-files' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "own vehicle files insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'vehicle-files' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "own vehicle files update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'vehicle-files' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'vehicle-files' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "own vehicle files delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'vehicle-files' AND (storage.foldername(name))[1] = auth.uid()::text);
