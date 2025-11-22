import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { BlogPost, BlogFrontmatter } from '@/types';

const postsDirectory = path.join(process.cwd(), 'content/blog');

// 읽기 시간 계산 (분)
function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

// 모든 블로그 포스트 가져오기
export function getAllBlogPosts(): BlogPost[] {
  try {
    // content/blog 폴더가 없으면 빈 배열 반환
    if (!fs.existsSync(postsDirectory)) {
      return [];
    }

    const fileNames = fs.readdirSync(postsDirectory);
    const allPostsData = fileNames
      .filter((fileName) => fileName.endsWith('.md'))
      .map((fileName) => {
        const slug = fileName.replace(/\.md$/, '');
        const fullPath = path.join(postsDirectory, fileName);
        const fileContents = fs.readFileSync(fullPath, 'utf8');
        const { data, content } = matter(fileContents);

        const frontmatter = data as BlogFrontmatter;

        return {
          slug,
          title: frontmatter.title,
          description: frontmatter.description,
          date: frontmatter.date,
          author: frontmatter.author,
          category: frontmatter.category,
          tags: frontmatter.tags || [],
          coverImage: frontmatter.coverImage,
          readingTime: calculateReadingTime(content),
          content,
        };
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1));

    return allPostsData;
  } catch (error) {
    console.error('Error reading blog posts:', error);
    return [];
  }
}

// slug로 특정 포스트 가져오기
export function getBlogPostBySlug(slug: string): BlogPost | null {
  try {
    const fullPath = path.join(postsDirectory, `${slug}.md`);

    if (!fs.existsSync(fullPath)) {
      return null;
    }

    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);

    const frontmatter = data as BlogFrontmatter;

    return {
      slug,
      title: frontmatter.title,
      description: frontmatter.description,
      date: frontmatter.date,
      author: frontmatter.author,
      category: frontmatter.category,
      tags: frontmatter.tags || [],
      coverImage: frontmatter.coverImage,
      readingTime: calculateReadingTime(content),
      content,
    };
  } catch (error) {
    console.error(`Error reading blog post ${slug}:`, error);
    return null;
  }
}

// 카테고리별 포스트 가져오기
export function getBlogPostsByCategory(category: string): BlogPost[] {
  const allPosts = getAllBlogPosts();
  return allPosts.filter((post) => post.category === category);
}

// 태그별 포스트 가져오기
export function getBlogPostsByTag(tag: string): BlogPost[] {
  const allPosts = getAllBlogPosts();
  return allPosts.filter((post) => post.tags.includes(tag));
}

// 모든 카테고리 가져오기
export function getAllCategories(): string[] {
  const allPosts = getAllBlogPosts();
  const categories = allPosts.map((post) => post.category);
  return Array.from(new Set(categories));
}

// 모든 태그 가져오기
export function getAllTags(): string[] {
  const allPosts = getAllBlogPosts();
  const tags = allPosts.flatMap((post) => post.tags);
  return Array.from(new Set(tags));
}
