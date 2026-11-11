CREATE TABLE public.regions (
  code text PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE
);
CREATE TABLE public.provinces (
  code text PRIMARY KEY,
  name text NOT NULL,
  abbreviation text NOT NULL UNIQUE,
  region_code text NOT NULL REFERENCES public.regions(code)
);
CREATE TABLE public.municipalities (
  istat_code text PRIMARY KEY,
  name text NOT NULL,
  province_code text NOT NULL REFERENCES public.provinces(code),
  region_code text NOT NULL REFERENCES public.regions(code),
  slug text NOT NULL UNIQUE,
  coat_of_arms_url text
);
CREATE INDEX ON public.municipalities(region_code);
CREATE INDEX ON public.municipalities(province_code);

CREATE TABLE public.catalog_meta (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  is_complete boolean NOT NULL DEFAULT false,
  national_total int NOT NULL DEFAULT 7896
);

CREATE TABLE public.user_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  istat_code text NOT NULL REFERENCES public.municipalities(istat_code) ON DELETE CASCADE,
  visited boolean NOT NULL DEFAULT false,
  visit_date date,
  notes text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, istat_code)
);
CREATE TABLE public.visit_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  istat_code text NOT NULL REFERENCES public.municipalities(istat_code) ON DELETE CASCADE,
  file_name text NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('photo','video')),
  storage_path text NOT NULL UNIQUE,
  caption text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.visit_media(user_id, istat_code);

GRANT SELECT ON public.regions, public.provinces, public.municipalities, public.catalog_meta TO anon, authenticated;
GRANT ALL ON public.regions, public.provinces, public.municipalities, public.catalog_meta TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_visits, public.visit_media TO authenticated;
GRANT ALL ON public.user_visits, public.visit_media TO service_role;

ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provinces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.municipalities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visit_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "geo read" ON public.regions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "geo read" ON public.provinces FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "geo read" ON public.municipalities FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "meta read" ON public.catalog_meta FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "own visits select" ON public.user_visits FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own visits insert" ON public.user_visits FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own visits update" ON public.user_visits FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own visits delete" ON public.user_visits FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own media select" ON public.visit_media FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own media insert" ON public.visit_media FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own media update" ON public.visit_media FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own media delete" ON public.visit_media FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER user_visits_touch BEFORE UPDATE ON public.user_visits FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE POLICY "media own read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'visit-media' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "media own insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'visit-media' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "media own update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'visit-media' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "media own delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'visit-media' AND (storage.foldername(name))[1] = auth.uid()::text);

INSERT INTO public.catalog_meta (id, is_complete, national_total) VALUES (1, false, 7896);
INSERT INTO public.regions (code, name, slug) VALUES
('01','Piemonte','piemonte'),('02','Valle d''Aosta','valle-d-aosta'),('03','Lombardia','lombardia'),
('04','Trentino-Alto Adige','trentino-alto-adige'),('05','Veneto','veneto'),('06','Friuli-Venezia Giulia','friuli-venezia-giulia'),
('07','Liguria','liguria'),('08','Emilia-Romagna','emilia-romagna'),('09','Toscana','toscana'),('10','Umbria','umbria'),
('11','Marche','marche'),('12','Lazio','lazio'),('13','Abruzzo','abruzzo'),('14','Molise','molise'),('15','Campania','campania'),
('16','Puglia','puglia'),('17','Basilicata','basilicata'),('18','Calabria','calabria'),('19','Sicilia','sicilia'),('20','Sardegna','sardegna');
INSERT INTO public.provinces (code, name, abbreviation, region_code) VALUES
('201','Torino','TO','01'),('215','Milano','MI','03'),('227','Venezia','VE','05'),('210','Genova','GE','07'),
('237','Bologna','BO','08'),('248','Firenze','FI','09'),('258','Roma','RM','12'),('263','Napoli','NA','15'),
('272','Bari','BA','16'),('282','Palermo','PA','19');
INSERT INTO public.municipalities (istat_code, name, province_code, region_code, slug) VALUES
('001272','Torino','201','01','torino'),('015146','Milano','215','03','milano'),('027042','Venezia','227','05','venezia'),
('010025','Genova','210','07','genova'),('037006','Bologna','237','08','bologna'),('048017','Firenze','248','09','firenze'),
('058091','Roma','258','12','roma'),('063049','Napoli','263','15','napoli'),('072006','Bari','272','16','bari'),
('082053','Palermo','282','19','palermo');