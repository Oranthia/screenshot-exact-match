ALTER TABLE public.municipalities ADD COLUMN IF NOT EXISTS id uuid NOT NULL DEFAULT gen_random_uuid();
CREATE UNIQUE INDEX IF NOT EXISTS municipalities_id_key ON public.municipalities(id);
ALTER TABLE public.municipalities ADD COLUMN IF NOT EXISTS official_istat_code text;
UPDATE public.municipalities SET official_istat_code = istat_code WHERE official_istat_code IS NULL AND istat_code ~ '^[0-9]{6}$';
CREATE UNIQUE INDEX IF NOT EXISTS municipalities_official_istat_code_key ON public.municipalities(official_istat_code) WHERE official_istat_code IS NOT NULL;
COMMENT ON COLUMN public.municipalities.id IS 'Stable internal city identifier, independent of optional official ISTAT code.';
COMMENT ON COLUMN public.municipalities.istat_code IS 'Legacy stable reference key for visits and storage; may be an old ISTAT code or city:<slug>. Never change after creation.';
COMMENT ON COLUMN public.municipalities.official_istat_code IS 'Optional official ISTAT code; never used as the mutable identity of a visit.';