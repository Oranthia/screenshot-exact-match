REVOKE ALL ON FUNCTION public.badge_rules() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.badge_metrics(uuid) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.award_user_badges(uuid) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.badges_after_change() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_my_badges() FROM anon;
REVOKE ALL ON FUNCTION public.set_my_featured_badges(text[]) FROM anon;