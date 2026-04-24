import { apiRequest } from "@/lib/api/client";

export type BlogStatusFilter = "active" | "inactive" | "all";

export interface BlogItem {
  id?: number;
  blog_id?: number;
  name: string;
  slug: string;
  description?: string;
  image?: string | null;
  status?: string;
  created_at?: string;
}

export interface GetBlogsParams {
  page?: number;
  limit?: number;
  status?: BlogStatusFilter;
}

export interface GetBlogsResponse {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  blogs: BlogItem[];
}

export interface GetBlogBySlugResponse {
  blog: BlogItem;
}

export interface SearchBlogsParams extends GetBlogsParams {
  q: string;
}

type BlogApiItem = {
  id?: number;
  title?: string;
  slug?: string;
  excerpt?: string | null;
  content?: string | null;
  featured_image_url?: string | null;
  published_at?: string | null;
};

type BlogsApiResponse = {
  data?: BlogApiItem[];
};

const normalizeBlog = (blog: BlogApiItem, index: number): BlogItem => ({
  id: blog.id ?? index + 1,
  blog_id: blog.id ?? index + 1,
  name: blog.title || "Blog Post",
  slug: blog.slug || "",
  description: blog.excerpt || blog.content || "",
  image: blog.featured_image_url || null,
  status: "active",
  created_at: blog.published_at || undefined,
});

export const getBlogs = async (params: GetBlogsParams = {}) => {
  const response = await apiRequest<BlogsApiResponse>("/api/blogs", {
    method: "GET",
    token: null,
  });

  const blogs = (response.data || []).map(normalizeBlog);
  const page = params.page ?? 1;
  const limit = params.limit ?? blogs.length;

  return {
    total: blogs.length,
    page,
    limit,
    totalPages: 1,
    blogs,
  };
};

export const getBlogBySlug = async (slug: string) => ({
  blog: normalizeBlog(
    await apiRequest<BlogApiItem>(`/api/blog/${encodeURIComponent(slug)}`, {
      method: "GET",
      token: null,
    }),
    0,
  ),
});

export const searchBlogs = async ({ q, page, limit }: SearchBlogsParams) => {
  const result = await getBlogs({ page, limit });
  const normalizedQuery = q.trim().toLowerCase();
  const blogs = result.blogs.filter((blog) => {
    const haystack = [blog.name, blog.description, blog.slug]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });

  return {
    total: blogs.length,
    page: page ?? 1,
    limit: limit ?? blogs.length,
    totalPages: 1,
    blogs,
  };
};
