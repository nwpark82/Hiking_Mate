-- ============================================
-- Fix Function Search Path Security Issues
-- ============================================
-- Add search_path to all functions to prevent schema injection attacks
-- Reference: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable

-- 1. Fix generate_slug function
CREATE OR REPLACE FUNCTION generate_slug(title TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  slug TEXT;
  counter INTEGER := 0;
  base_slug TEXT;
BEGIN
  base_slug := lower(regexp_replace(title, '[^a-zA-Z0-9가-힣\s-]', '', 'g'));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  slug := base_slug;

  WHILE EXISTS (SELECT 1 FROM public.blogs WHERE blogs.slug = slug) LOOP
    counter := counter + 1;
    slug := base_slug || '-' || counter;
  END LOOP;

  RETURN slug;
END;
$$;

-- 2. Fix update_modified_column function
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 3. Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 4. Fix increment_post_likes function
CREATE OR REPLACE FUNCTION increment_post_likes()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE posts
  SET likes_count = likes_count + 1
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$;

-- 5. Fix decrement_post_likes function
CREATE OR REPLACE FUNCTION decrement_post_likes()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE posts
  SET likes_count = GREATEST(0, likes_count - 1)
  WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$;

-- 6. Fix increment_post_comments function
CREATE OR REPLACE FUNCTION increment_post_comments()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE posts
  SET comments_count = comments_count + 1
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$;

-- 7. Fix decrement_post_comments function
CREATE OR REPLACE FUNCTION decrement_post_comments()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE posts
  SET comments_count = GREATEST(0, comments_count - 1)
  WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$;

-- 8. Fix increment_view_count function (for trails)
CREATE OR REPLACE FUNCTION increment_view_count()
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

-- 9. Fix toggle_like function
CREATE OR REPLACE FUNCTION toggle_like(p_post_id UUID, p_user_id UUID)
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

-- 10. Fix update_user_stats function
CREATE OR REPLACE FUNCTION update_user_stats()
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

-- 11. Fix update_comment_count function
CREATE OR REPLACE FUNCTION update_comment_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts
    SET comments_count = comments_count + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts
    SET comments_count = GREATEST(0, comments_count - 1)
    WHERE id = OLD.post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Function search_path security fix completed!';
  RAISE NOTICE '📊 Fixed 11 functions with mutable search_path';
  RAISE NOTICE '🔒 All functions now use: SET search_path = public, pg_temp';
  RAISE NOTICE '';
  RAISE NOTICE '🛡️  Security improvements:';
  RAISE NOTICE '   - Protected against schema injection attacks';
  RAISE NOTICE '   - Explicit schema references (public)';
  RAISE NOTICE '   - Temporary tables allowed (pg_temp)';
END $$;
