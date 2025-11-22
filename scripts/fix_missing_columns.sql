-- ============================================
-- Fix Missing Columns in trails table
-- ============================================

-- Add missing columns
ALTER TABLE trails ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0;
ALTER TABLE trails ADD COLUMN IF NOT EXISTS hike_count INTEGER DEFAULT 0;
ALTER TABLE trails ADD COLUMN IF NOT EXISTS max_altitude INTEGER;
ALTER TABLE trails ADD COLUMN IF NOT EXISTS access_info TEXT;
ALTER TABLE trails ADD COLUMN IF NOT EXISTS health_benefits JSONB DEFAULT '[]';
ALTER TABLE trails ADD COLUMN IF NOT EXISTS attractions JSONB DEFAULT '[]';
ALTER TABLE trails ADD COLUMN IF NOT EXISTS warnings JSONB DEFAULT '[]';

-- Create indexes for like_count (for sorting)
CREATE INDEX IF NOT EXISTS idx_trails_like_count ON trails(like_count DESC);

-- Create indexes for health_benefits and attractions (for filtering)
CREATE INDEX IF NOT EXISTS idx_trails_health_benefits ON trails USING GIN(health_benefits);
CREATE INDEX IF NOT EXISTS idx_trails_attractions ON trails USING GIN(attractions);

-- Comments for documentation
COMMENT ON COLUMN trails.like_count IS 'Number of users who liked this trail';
COMMENT ON COLUMN trails.hike_count IS 'Number of completed hikes on this trail';
COMMENT ON COLUMN trails.max_altitude IS 'Maximum altitude of the trail in meters';
COMMENT ON COLUMN trails.access_info IS 'Information about how to access the trail';
COMMENT ON COLUMN trails.health_benefits IS 'Array of health benefits (e.g., ["심폐기능", "근력강화"])';
COMMENT ON COLUMN trails.attractions IS 'Array of attractions along the trail (e.g., ["폭포", "전망대"])';
COMMENT ON COLUMN trails.warnings IS 'Array of warnings and precautions (e.g., ["급경사", "낙석주의"])';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Missing columns added successfully!';
END $$;
