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

export const getBlogs = (params: GetBlogsParams = {}) => {
  const searchParams = new URLSearchParams();

  if (params.page && params.page > 0) {
    searchParams.set("page", String(params.page));
  }

  if (params.limit && params.limit > 0) {
    searchParams.set("limit", String(params.limit));
  }

  if (params.status) {
    searchParams.set("status", params.status);
  }

  const query = searchParams.toString();

  return apiRequest<GetBlogsResponse>(query ? `/blogs?${query}` : "/blogs", {
    method: "GET",
    token: null,
  });
};

export const getBlogBySlug = (slug: string) =>
  apiRequest<GetBlogBySlugResponse>(`/blog/${encodeURIComponent(slug)}`, {
    method: "GET",
    token: null,
  });

export const searchBlogs = ({ q, page, limit, status }: SearchBlogsParams) => {
  const searchParams = new URLSearchParams();
  const normalizedQuery = q.trim();

  searchParams.set("q", normalizedQuery);

  if (page && page > 0) {
    searchParams.set("page", String(page));
  }

  if (limit && limit > 0) {
    searchParams.set("limit", String(limit));
  }

  if (status) {
    searchParams.set("status", status);
  }

  return apiRequest<GetBlogsResponse>(
    `/search/blogs?${searchParams.toString()}`,
    {
      method: "GET",
      token: null,
    },
  );
};
