CREATE TABLE public.visit_experiences (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL,
 city_id uuid NOT NULL REFERENCES public.municipalities(id), istat_code text NOT NULL REFERENCES public.municipalities(istat_code),
 title text NOT NULL DEFAULT 'Ricordo di viaggio', visit_date date, notes text,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 legacy_source_key text, deleting boolean NOT NULL DEFAULT false,
 UNIQUE(user_id,legacy_source_key), UNIQUE(id,user_id,istat_code)
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.visit_experiences TO authenticated;
GRANT ALL ON public.visit_experiences TO service_role;
ALTER TABLE public.visit_experiences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own experiences read" ON public.visit_experiences FOR SELECT TO authenticated USING(auth.uid()=user_id);
CREATE POLICY "own experiences insert" ON public.visit_experiences FOR INSERT TO authenticated WITH CHECK(auth.uid()=user_id);
CREATE POLICY "own experiences update" ON public.visit_experiences FOR UPDATE TO authenticated USING(auth.uid()=user_id) WITH CHECK(auth.uid()=user_id);
CREATE POLICY "own experiences delete" ON public.visit_experiences FOR DELETE TO authenticated USING(auth.uid()=user_id);
CREATE INDEX experiences_owner_city ON public.visit_experiences(user_id,istat_code);
ALTER TABLE public.visit_media ADD COLUMN experience_id uuid;
INSERT INTO public.visit_experiences(user_id,city_id,istat_code,title,visit_date,notes,legacy_source_key)
SELECT x.user_id,m.id,x.istat_code,'Il mio primo ricordo',v.visit_date,v.notes,'city:'||x.istat_code
FROM (SELECT user_id,istat_code FROM public.user_visits WHERE visit_date IS NOT NULL OR coalesce(notes,'')<>'' UNION SELECT user_id,istat_code FROM public.visit_media) x
JOIN public.municipalities m ON m.istat_code=x.istat_code LEFT JOIN public.user_visits v ON v.user_id=x.user_id AND v.istat_code=x.istat_code
ON CONFLICT(user_id,legacy_source_key) DO NOTHING;
UPDATE public.visit_media vm SET experience_id=e.id FROM public.visit_experiences e WHERE e.user_id=vm.user_id AND e.istat_code=vm.istat_code AND e.legacy_source_key='city:'||vm.istat_code AND vm.experience_id IS NULL;
ALTER TABLE public.visit_media ADD CONSTRAINT media_experience_owner_city FOREIGN KEY(experience_id,user_id,istat_code) REFERENCES public.visit_experiences(id,user_id,istat_code) ON DELETE RESTRICT;
CREATE OR REPLACE FUNCTION public.validate_experience() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.municipalities WHERE id=NEW.city_id AND istat_code=NEW.istat_code) THEN RAISE EXCEPTION 'City mismatch'; END IF;
 IF TG_OP='UPDATE' AND (NEW.user_id<>OLD.user_id OR NEW.city_id<>OLD.city_id OR NEW.istat_code<>OLD.istat_code OR NEW.legacy_source_key IS DISTINCT FROM OLD.legacy_source_key) THEN RAISE EXCEPTION 'Experience identity is immutable'; END IF;
 IF TG_OP='UPDATE' AND OLD.deleting AND NOT NEW.deleting THEN RAISE EXCEPTION 'Deletion in progress'; END IF;
 NEW.title:=coalesce(nullif(btrim(NEW.title),''),'Ricordo di viaggio'); RETURN NEW; END $$;
CREATE TRIGGER validate_experience BEFORE INSERT OR UPDATE ON public.visit_experiences FOR EACH ROW EXECUTE FUNCTION public.validate_experience();
CREATE TRIGGER experience_touch BEFORE UPDATE ON public.visit_experiences FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE OR REPLACE FUNCTION public.validate_experience_media() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN
 IF NEW.experience_id IS NULL THEN RAISE EXCEPTION 'Experience required'; END IF;
 PERFORM 1 FROM public.visit_experiences WHERE id=NEW.experience_id AND user_id=NEW.user_id AND istat_code=NEW.istat_code AND NOT deleting FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Experience unavailable'; END IF;
 IF split_part(NEW.storage_path,'/',1)<>NEW.user_id::text OR split_part(NEW.storage_path,'/',2)<>NEW.istat_code THEN RAISE EXCEPTION 'Invalid media path'; END IF;
 IF TG_OP='UPDATE' AND (NEW.experience_id IS DISTINCT FROM OLD.experience_id OR NEW.user_id<>OLD.user_id OR NEW.istat_code<>OLD.istat_code OR NEW.storage_path<>OLD.storage_path) THEN RAISE EXCEPTION 'Media identity is immutable'; END IF;
 RETURN NEW; END $$;
CREATE TRIGGER validate_experience_media BEFORE INSERT OR UPDATE ON public.visit_media FOR EACH ROW EXECUTE FUNCTION public.validate_experience_media();
CREATE OR REPLACE FUNCTION public.create_my_experience(_city_id uuid,_title text,_visit_date date,_notes text,_confirm_visit boolean) RETURNS public.visit_experiences LANGUAGE plpgsql SET search_path=public AS $$ DECLARE uid uuid:=auth.uid(); city public.municipalities; item public.visit_experiences; BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
 SELECT * INTO city FROM public.municipalities WHERE id=_city_id;
 IF city.id IS NULL THEN RAISE EXCEPTION 'City unavailable'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(uid::text||city.istat_code,0));
 IF NOT EXISTS(SELECT 1 FROM public.user_visits WHERE user_id=uid AND istat_code=city.istat_code AND visited) THEN
 IF NOT coalesce(_confirm_visit,false) THEN RAISE EXCEPTION 'Visit confirmation required'; END IF;
 INSERT INTO public.user_visits(user_id,istat_code,visited) VALUES(uid,city.istat_code,true) ON CONFLICT(user_id,istat_code) DO UPDATE SET visited=true;
 END IF;
 INSERT INTO public.visit_experiences(user_id,city_id,istat_code,title,visit_date,notes) VALUES(uid,city.id,city.istat_code,coalesce(nullif(btrim(_title),''),'Ricordo di viaggio'),_visit_date,_notes) RETURNING * INTO item; RETURN item;
 END $$;
REVOKE ALL ON FUNCTION public.create_my_experience(uuid,text,date,text,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.create_my_experience(uuid,text,date,text,boolean) TO authenticated,service_role;
COMMENT ON COLUMN public.user_visits.visit_date IS 'DEPRECATED: immutable legacy fallback; active dates are in visit_experiences';
COMMENT ON COLUMN public.user_visits.notes IS 'DEPRECATED: immutable legacy fallback; active notes are in visit_experiences';