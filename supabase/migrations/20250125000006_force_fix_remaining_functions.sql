-- ============================================
-- Force Fix Remaining Function Security Issues
-- ============================================
-- Drop and recreate functions that still show warnings
-- This ensures old versions are completely removed

-- 1. Drop all versions of increment_view_count (in case there are multiple)
DROP FUNCTION IF EXISTS public.increment_view_count() CASCADE;
DROP FUNCTION IF EXISTS public.increment_view_count(UUID) CASCADE;

-- 2. Drop toggle_like if exists
DROP FUNCTION IF EXISTS public.toggle_like(UUID, UUID) CASCADE;

-- 3. Drop update_user_stats if exists
DROP FUNCTION IF EXISTS public.update_user_stats() CASCADE;

-- Now recreate them with proper search_path

-- Recreate increment_view_count (trigger function)
CREATE FUNCTION public.increment_view_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_TABLE_NAME = 'trails' THEN
    UPDATE trails
    SET view_count = view_count + 1
    WHERE id = NEW.trail_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Recreate toggle_like function
CREATE FUNCTION public.toggle_like(p_post_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  like_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM likes
    WHERE post_id = p_post_id AND user_id = p_user_id
  ) INTO like_exists;

  IF like_exists THEN
    DELETE FROM likes
    WHERE post_id = p_post_id AND user_id = p_user_id;
    RETURN FALSE;
  ELSE
    INSERT INTO likes (post_id, user_id)
    VALUES (p_post_id, p_user_id);
    RETURN TRUE;
  END IF;
END;
$$;

-- Recreate update_user_stats function
CREATE FUNCTION public.update_user_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE users
    SET
      total_trails = total_trails + 1,
      total_distance = total_distance + COALESCE(NEW.distance, 0)
    WHERE id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE users
    SET
      total_trails = GREATEST(0, total_trails - 1),
      total_distance = GREATEST(0, total_distance - COALESCE(OLD.distance, 0))
    WHERE id = OLD.user_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Force fixed remaining function security issues!';
  RAISE NOTICE '📊 Fixed functions:';
  RAISE NOTICE '   - increment_view_count (all versions dropped and recreated)';
  RAISE NOTICE '   - toggle_like (recreated with search_path)';
  RAISE NOTICE '   - update_user_stats (recreated with search_path)';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 All functions now use: SET search_path = public, pg_temp';
END $$;
