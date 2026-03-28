-- Quick win: optimize active-unit availability scans used by search/list endpoints.
CREATE INDEX IF NOT EXISTS idx_units_active_status_available_from
ON public.units (status, available_from)
WHERE status = 'active';

