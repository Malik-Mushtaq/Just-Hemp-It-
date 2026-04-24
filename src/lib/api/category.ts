import { apiRequest } from "@/lib/api/client";

export interface SubcategoryItem {
  id: string | number;
  name: string;
  image?: string | null;
}

export interface CategoryItem {
  id: string | number;
  name: string;
  category_name: string;
  image?: string | null;
  subcategories?: SubcategoryItem[];
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface GetCategoriesResponse {
  categories: CategoryItem[];
  cached?: boolean;
}

type CategoryApiItem = {
  id?: string | number;
  name?: string;
  image?: string | null;
  subcategories?: Array<{
    id?: string | number;
    name?: string;
    image?: string | null;
  }>;
};

type CategoriesApiResponse = {
  data?: CategoryApiItem[];
};

const normalizeCategory = (category: CategoryApiItem): CategoryItem => ({
  id: category.id ?? "",
  name: category.name || "",
  category_name: category.name || "",
  image: category.image ?? null,
  subcategories: (category.subcategories || []).map((subcategory) => ({
    id: subcategory.id ?? "",
    name: subcategory.name || "",
    image: subcategory.image ?? null,
  })),
});

export const getCategories = async () => {
  const response = await apiRequest<CategoriesApiResponse>("/api/categories", {
    method: "GET",
    token: null,
  });

  return {
    categories: (response.data || []).map(normalizeCategory),
    cached: false,
  };
};
