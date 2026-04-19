import { apiRequest } from "@/lib/api/client";

export interface CategoryItem {
  id: number;
  category_name: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface GetCategoriesResponse {
  categories: CategoryItem[];
  cached?: boolean;
}

export const getCategories = () =>
  apiRequest<GetCategoriesResponse>("/category/all", {
    method: "GET",
    token: null,
  });
