REVOKE INSERT ON public.visit_experiences FROM authenticated;
CREATE OR REPLACE FUNCTION public.create_my_experience(_city_id uuid,_title text,_visit_date date,_notes text,_confirm_visit boolean) RETURNS public.visit_experiences LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE uid uuid:=auth.uid(); city public.municipalities; item public.visit_experiences; BEGIN
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
CREATE OR REPLACE FUNCTION public.preserve_legacy_visit_fields() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN
 IF TG_OP='UPDATE' AND (NEW.visit_date IS DISTINCT FROM OLD.visit_date OR NEW.notes IS DISTINCT FROM OLD.notes) THEN RAISE EXCEPTION 'Edit dates and notes in experiences'; END IF;
 IF TG_OP='INSERT' AND (NEW.visit_date IS NOT NULL OR NEW.notes IS NOT NULL) THEN RAISE EXCEPTION 'Use experiences for dates and notes'; END IF;
 RETURN NEW; END $$;
CREATE TRIGGER preserve_legacy_visit_fields BEFORE INSERT OR UPDATE ON public.user_visits FOR EACH ROW EXECUTE FUNCTION public.preserve_legacy_visit_fields();