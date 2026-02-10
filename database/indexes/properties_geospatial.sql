-- Geospatial indexes for properties table
-- These indexes improve performance for location-based queries

-- Index for latitude and longitude columns (for bounding box queries)
CREATE INDEX IF NOT EXISTS idx_properties_lat_lng
ON public.properties (latitude, longitude)
WHERE latitude IS NOT NULL AND longitude IS NOT NULL
TABLESPACE pg_default;

-- GIN index for location jsonb field (for city/state searches)
CREATE INDEX IF NOT EXISTS idx_properties_location_gin
ON public.properties USING GIN (location)
TABLESPACE pg_default;

-- Optional: PostGIS spatial index (requires earthdistance extension)
-- Uncomment if you want to enable PostGIS for accurate distance calculations
--
-- CREATE EXTENSION IF NOT EXISTS earthdistance CASCADE;
-- CREATE EXTENSION IF NOT EXISTS cube;
--
-- CREATE INDEX IF NOT EXISTS idx_properties_earth_coords
-- ON public.properties
-- USING GIST (ll_to_earth(latitude::float8, longitude::float8))
-- WHERE latitude IS NOT NULL AND longitude IS NOT NULL
-- TABLESPACE pg_default;

-- Comments for documentation
COMMENT ON INDEX idx_properties_lat_lng IS 'Index for geospatial queries using latitude and longitude';
COMMENT ON INDEX idx_properties_location_gin IS 'GIN index for searching location jsonb field (city, state, country)';

