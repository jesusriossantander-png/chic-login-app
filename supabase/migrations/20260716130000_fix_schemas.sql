-- Fix profiles table adding missing role column if not present (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role') THEN
    ALTER TABLE public.profiles ADD COLUMN role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin'));
  END IF;
END
$$;

-- Ensure documents table exists (idempotent)
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area TEXT NOT NULL CHECK (area IN ('SEG E HIG', 'TALLER', 'MECANIZADO', 'VEHICULOS', 'PLANTA')),
  title TEXT NOT NULL,
  description TEXT,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL UNIQUE,
  file_size BIGINT NOT NULL DEFAULT 0,
  mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure fines table exists
CREATE TABLE IF NOT EXISTS public.fines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  infraccion TEXT NOT NULL,
  monto DECIMAL(12,2) NOT NULL DEFAULT 0,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  vehiculo TEXT,
  conductor TEXT,
  estado TEXT NOT NULL CHECK (estado IN ('Pendiente', 'Pagada', 'Apelada')) DEFAULT 'Pendiente',
  observaciones TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fines TO authenticated;
GRANT ALL ON public.fines TO service_role;

-- RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fines ENABLE ROW LEVEL SECURITY;

-- Policies for documents (simplified for quick fix)
DROP POLICY IF EXISTS "authenticated can read documents" ON public.documents;
CREATE POLICY "authenticated can read documents" ON public.documents FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "authenticated can manage documents" ON public.documents;
CREATE POLICY "authenticated can manage documents" ON public.documents FOR ALL TO authenticated USING (true);

-- Policies for fines
DROP POLICY IF EXISTS "users can manage their own fines" ON public.fines;
CREATE POLICY "users can manage their own fines" ON public.fines FOR ALL TO authenticated USING (auth.uid() = user_id);
