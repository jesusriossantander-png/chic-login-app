
-- Enums
CREATE TYPE public.severity_level AS ENUM ('baja','media','alta','critica');
CREATE TYPE public.report_status AS ENUM ('abierto','en_revision','cerrado');

-- updated_at helper
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

-- profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  company TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)));
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- safety_reports
CREATE TABLE public.safety_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  location TEXT,
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  severity public.severity_level NOT NULL DEFAULT 'media',
  status public.report_status NOT NULL DEFAULT 'abierto',
  description TEXT,
  corrective_actions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.safety_reports TO authenticated;
GRANT ALL ON public.safety_reports TO service_role;
ALTER TABLE public.safety_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own reports all" ON public.safety_reports FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER safety_reports_updated_at BEFORE UPDATE ON public.safety_reports FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX safety_reports_user_idx ON public.safety_reports(user_id, report_date DESC);

-- driving_controls
CREATE TABLE public.driving_controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  driver_name TEXT NOT NULL,
  vehicle TEXT,
  control_date DATE NOT NULL DEFAULT CURRENT_DATE,
  score INTEGER NOT NULL DEFAULT 100,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.driving_controls TO authenticated;
GRANT ALL ON public.driving_controls TO service_role;
ALTER TABLE public.driving_controls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own driving all" ON public.driving_controls FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER driving_controls_updated_at BEFORE UPDATE ON public.driving_controls FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX driving_controls_user_idx ON public.driving_controls(user_id, control_date DESC);

-- Score validation via trigger (avoid CHECK for flexibility)
CREATE OR REPLACE FUNCTION public.validate_driving_score() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.score < 0 OR NEW.score > 100 THEN
    RAISE EXCEPTION 'score must be between 0 and 100';
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER driving_controls_validate_score BEFORE INSERT OR UPDATE ON public.driving_controls
FOR EACH ROW EXECUTE FUNCTION public.validate_driving_score();
