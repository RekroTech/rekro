-- Quick win: speed up default public listing queries ordered by newest.
CREATE INDEX IF NOT EXISTS idx_properties_is_published_created_at_desc
ON public.properties (is_published, created_at DESC);

