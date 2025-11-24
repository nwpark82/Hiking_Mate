export interface Blog {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  content: string;
  author_id: string | null;
  author_name: string;
  category: string;
  tags: string[];
  cover_image: string | null;
  published: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateBlogInput {
  title: string;
  description?: string;
  content: string;
  author_name: string;
  category: string;
  tags?: string[];
  cover_image?: string;
  published?: boolean;
}

export interface UpdateBlogInput extends Partial<CreateBlogInput> {
  id: string;
}
