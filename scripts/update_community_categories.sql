-- ============================================
-- 커뮤니티 카테고리 업데이트 마이그레이션
-- ============================================
-- 목적: 커뮤니티 카테고리를 재구성하고 'gear' 카테고리 제거
-- 변경: review, question, tip, general → review, question, info, companion
-- 날짜: 2025-01-23

-- 1. 기존 데이터 확인 (실행 전 검토용)
SELECT category, COUNT(*) as count
FROM posts
GROUP BY category;

-- 2. 기존 카테고리 제약 조건 제거
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_category_check;

-- 3. 기존 데이터 마이그레이션
-- tip → info 변경
UPDATE posts SET category = 'info' WHERE category = 'tip';

-- general → info 변경
UPDATE posts SET category = 'info' WHERE category = 'general';

-- gear 카테고리가 있다면 question으로 변경 (임시 처리)
-- 또는 삭제 정책에 따라 처리
UPDATE posts SET category = 'question' WHERE category = 'gear';

-- 4. 새로운 카테고리 제약 조건 추가
ALTER TABLE posts ADD CONSTRAINT posts_category_check
  CHECK (category IN ('review', 'question', 'info', 'companion'));

-- 5. 변경 후 데이터 확인
SELECT category, COUNT(*) as count
FROM posts
GROUP BY category;

-- 6. 카테고리 설명 추가 (선택사항)
COMMENT ON COLUMN posts.category IS '게시글 카테고리: review(후기), question(질문), info(정보), companion(동행찾기)';

-- ============================================
-- 완료 후 확인사항
-- ============================================
-- □ 모든 posts의 category가 새 카테고리 중 하나인지 확인
-- □ 기존 gear 게시글이 적절히 처리되었는지 확인
-- □ UI에서 카테고리 필터가 정상 작동하는지 확인
