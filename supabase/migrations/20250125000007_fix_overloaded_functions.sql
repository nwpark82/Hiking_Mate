-- ============================================
-- Fix Overloaded Function Security Issues
-- ============================================
-- Fix the alternative signatures of functions that still have missing search_path

-- 1. Fix increment_view_count(table_name, row_id) - the overloaded version
CREATE OR REPLACE FUNCTION public.increment_view_count(table_name text, row_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF table_name = 'trails' THEN
    UPDATE trails SET view_count = view_count + 1 WHERE id = row_id;
  ELSIF table_name = 'posts' THEN
    UPDATE posts SET view_count = view_count + 1 WHERE id = row_id;
  END IF;
END;
$$;

-- 2. Fix toggle_like(p_post_id) - the single parameter version
CREATE OR REPLACE FUNCTION public.toggle_like(p_post_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_liked BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM likes
    WHERE user_id = v_user_id AND post_id = p_post_id
  ) INTO v_liked;

  IF v_liked THEN
    DELETE FROM likes
    WHERE user_id = v_user_id AND post_id = p_post_id;

    UPDATE posts
    SET like_count = like_count - 1
    WHERE id = p_post_id;

    RETURN FALSE;
  ELSE
    INSERT INTO likes (user_id, post_id)
    VALUES (v_user_id, p_post_id);

    UPDATE posts
    SET like_count = like_count + 1
    WHERE id = p_post_id;

    RETURN TRUE;
  END IF;
END;
$$;

-- 3. Fix update_user_stats(p_user_id) - the overloaded version
CREATE OR REPLACE FUNCTION public.update_user_stats(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE users SET
    total_distance = (
      SELECT COALESCE(SUM(distance), 0)
      FROM hikes
      WHERE user_id = p_user_id AND is_completed = true
    ),
    total_duration = (
      SELECT COALESCE(SUM(duration), 0)
      FROM hikes
      WHERE user_id = p_user_id AND is_completed = true
    ),
    total_mountains = (
      SELECT COUNT(DISTINCT trail_id)
      FROM hikes
      WHERE user_id = p_user_id AND is_completed = true AND trail_id IS NOT NULL
    )
  WHERE id = p_user_id;
END;
$$;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Fixed overloaded function security issues!';
  RAISE NOTICE '📊 Fixed 3 additional function signatures:';
  RAISE NOTICE '   - increment_view_count(table_name, row_id)';
  RAISE NOTICE '   - toggle_like(p_post_id)';
  RAISE NOTICE '   - update_user_stats(p_user_id)';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 All function versions now have: SET search_path = public, pg_temp';
END $$;
