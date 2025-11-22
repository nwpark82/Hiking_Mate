-- ============================================
-- Migration: Add Trail Classification Columns
-- Date: 2025-11-21
-- Purpose: Add columns for 5-type trail classification system
-- ============================================

-- Add trail_type column (5-type classification)
ALTER TABLE trails ADD COLUMN IF NOT EXISTS trail_type TEXT;

-- Add overlap_rate column (percentage of path overlap)
ALTER TABLE trails ADD COLUMN IF NOT EXISTS overlap_rate FLOAT;

-- Add path_coordinates column (renamed from coordinates for clarity)
ALTER TABLE trails ADD COLUMN IF NOT EXISTS path_coordinates JSONB;

-- Add start point coordinates
ALTER TABLE trails ADD COLUMN IF NOT EXISTS start_latitude FLOAT;
ALTER TABLE trails ADD COLUMN IF NOT EXISTS start_longitude FLOAT;

-- Create index for trail_type for faster filtering
CREATE INDEX IF NOT EXISTS idx_trails_trail_type ON trails(trail_type);

-- Create index for overlap_rate for analytics
CREATE INDEX IF NOT EXISTS idx_trails_overlap_rate ON trails(overlap_rate);

-- Copy existing coordinates to path_coordinates if path_coordinates is empty
UPDATE trails
SET path_coordinates = coordinates
WHERE path_coordinates IS NULL AND coordinates IS NOT NULL;

-- Comments for documentation
COMMENT ON COLUMN trails.trail_type IS '5-type trail classification: ROUNDTRIP, CIRCULAR_PARTIAL, CIRCULAR_UNIQUE, ONEWAY_PARTIAL, ONEWAY_UNIQUE';
COMMENT ON COLUMN trails.overlap_rate IS 'Percentage of path that overlaps with itself (0.0 to 1.0)';
COMMENT ON COLUMN trails.path_coordinates IS 'Array of {lat, lng} coordinates for the trail path';
COMMENT ON COLUMN trails.start_latitude IS 'Latitude of trail starting point';
COMMENT ON COLUMN trails.start_longitude IS 'Longitude of trail starting point';
