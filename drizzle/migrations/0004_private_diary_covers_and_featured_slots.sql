ALTER TABLE public.visit_media ADD COLUMN is_cover boolean NOT NULL DEFAULT false;
ALTER TABLE public.visit_media ADD CONSTRAINT cover_must_be_photo CHECK (NOT is_cover OR media_type = 'photo');
CREATE UNIQUE INDEX visit_media_one_cover ON public.visit_media(user_id, istat_code) WHERE is_cover;
CREATE OR REPLACE FUNCTION public.set_my_city_cover(_media_id uuid) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE item public.visit_media; uid uuid := auth.uid();
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
 SELECT * INTO item FROM public.visit_media WHERE id = _media_id AND user_id = uid AND media_type = 'photo';
 IF item.id IS NULL THEN RAISE EXCEPTION 'Photo not available'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(uid::text || item.istat_code, 0));
 UPDATE public.visit_media SET is_cover = false WHERE user_id = uid AND istat_code = item.istat_code AND is_cover;
 UPDATE public.visit_media SET is_cover = true WHERE id = item.id AND user_id = uid;
END $$;
REVOKE ALL ON FUNCTION public.set_my_city_cover(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_my_city_cover(uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.set_my_featured_badge_slot(_position smallint, _badge_id text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); previous_id text; existing_position smallint;
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
 IF _position IS NULL OR _position NOT BETWEEN 1 AND 3 THEN RAISE EXCEPTION 'Invalid position'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(uid::text, 0));
 IF _badge_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.user_badges WHERE user_id = uid AND badge_id = _badge_id) THEN RAISE EXCEPTION 'Badge not earned'; END IF;
 SELECT badge_id INTO previous_id FROM public.user_featured_badges WHERE user_id = uid AND position = _position;
 SELECT position INTO existing_position FROM public.user_featured_badges WHERE user_id = uid AND badge_id = _badge_id;
 DELETE FROM public.user_featured_badges WHERE user_id = uid AND (position = _position OR position = existing_position);
 IF _badge_id IS NOT NULL THEN INSERT INTO public.user_featured_badges(user_id,badge_id,position) VALUES(uid,_badge_id,_position); END IF;
 IF existing_position IS NOT NULL AND existing_position <> _position AND previous_id IS NOT NULL THEN INSERT INTO public.user_featured_badges(user_id,badge_id,position) VALUES(uid,previous_id,existing_position); END IF;
END $$;
REVOKE ALL ON FUNCTION public.set_my_featured_badge_slot(smallint,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_my_featured_badge_slot(smallint,text) TO authenticated;
COMMENT ON COLUMN public.visit_media.is_cover IS 'Owner-selected diary photo; unique per owner/city, otherwise earliest available photo.';