import { apiRequest } from "@/lib/api/client";

export type ProductSortPrice = "asc" | "desc";
export type ProductPricingMode = "retailer" | "wholesaler";

export interface ProductVariation {
  variation_id: number;
  variation_name: string;
  price: number;
  discounted_price: number | null;
  minimum_order_quantity?: number | null;
  min_order_quantity?: number | null;
  moq?: number | null;
  stock: number;
  available_stock?: number | null;
  used_stock?: number | null;
  updated_at?: string;
}

export interface ProductReview {
  review_id: number;
  product_id: number;
  user_id: number;
  user_name: string;
  rating: number;
  review_text: string;
  created_at: string;
  updated_at?: string;
}

export interface ProductItem {
  id: number;
  slug: string;
  product_name: string;
  price: number;
  minimum_order_quantity?: number | null;
  min_order_quantity?: number | null;
  moq?: number | null;
  discount_percentage?: number | null;
  discount_price?: number | null;
  sold_count?: number;
  description?: string | null;
  category_id: number;
  category_name?: string | null;
  status?: string | boolean;
  main_img?: string | null;
  support_imgs?: string[];
  avg_rating: number;
  main_variation_name?: string | null;
  variations: ProductVariation[];
  reviews?: ProductReview[];
  created_at?: string;
  updated_at?: string;
}

export interface GetProductsParams {
  page?: number;
  limit?: number;
  category_id?: number;
  price_min?: number;
  price_max?: number;
  rating_min?: number;
  sort_price?: ProductSortPrice;
  new_arrival?: boolean;
  best_seller?: boolean;
}

export interface GetProductsResponse {
  message: string;
  page: number;
  limit: number;
  total_products: number;
  total_pages: number;
  products: ProductItem[];
}

export interface SearchProductsParams {
  q: string;
  page?: number;
  limit?: number;
}

export interface SearchProductsResponse extends GetProductsResponse {
  q: string;
}

const parseAmount = (value: unknown) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
};

const toRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;

export const getMinimumOrderQuantity = (value: unknown) => {
  const source = toRecord(value);

  if (!source) {
    return 1;
  }

  const candidates = [
    source.minimum_order_quantity,
    source.min_order_quantity,
    source.minimum_qty,
    source.min_qty,
    source.moq,
  ];

  for (const candidate of candidates) {
    const numericValue = Number(candidate);

    if (Number.isFinite(numericValue) && numericValue > 0) {
      return Math.trunc(numericValue);
    }
  }

  return 1;
};

export const getVariationEffectivePrice = (
  variation: ProductVariation,
  mode: ProductPricingMode = "wholesaler",
) =>
  mode === "wholesaler"
    ? parseAmount(variation.discounted_price ?? variation.price)
    : parseAmount(variation.price);

export const getProductDefaultVariation = (product: ProductItem) => {
  if (!product.variations?.length) {
    return null;
  }

  if (product.main_variation_name) {
    const matchedVariation = product.variations.find(
      (variation) => variation.variation_name === product.main_variation_name,
    );

    if (matchedVariation) {
      return matchedVariation;
    }
  }

  return product.variations[0] || null;
};

export const getProductDisplayPrice = (
  product: ProductItem,
  mode: ProductPricingMode = "wholesaler",
) => {
  const defaultVariation = getProductDefaultVariation(product);

  if (defaultVariation) {
    return getVariationEffectivePrice(defaultVariation, mode);
  }

  return parseAmount(
    mode === "wholesaler" ? product.discount_price ?? product.price : product.price,
  );
};

export const getProductBasePrice = (product: ProductItem) => {
  const defaultVariation = getProductDefaultVariation(product);

  if (defaultVariation) {
    return parseAmount(defaultVariation.price);
  }

  return parseAmount(product.price);
};

export const getProductMinimumOrderQuantity = (product: ProductItem) => {
  const defaultVariation = getProductDefaultVariation(product);

  if (defaultVariation) {
    return getMinimumOrderQuantity(defaultVariation);
  }

  return getMinimumOrderQuantity(product);
};

export const getProductPriceRange = (
  product: ProductItem,
  mode: ProductPricingMode = "wholesaler",
) => {
  const variationPrices = (product.variations || [])
    .map((variation) => getVariationEffectivePrice(variation, mode))
    .filter((price) => Number.isFinite(price));

  if (!variationPrices.length) {
    const fallbackPrice = getProductDisplayPrice(product, mode);
    return {
      min: fallbackPrice,
      max: fallbackPrice,
    };
  }

  return {
    min: Math.min(...variationPrices),
    max: Math.max(...variationPrices),
  };
};

export const getProductPricingSummary = (
  product: ProductItem,
  mode: ProductPricingMode = "wholesaler",
) => {
  const defaultVariation = getProductDefaultVariation(product);
  const currentPrice = defaultVariation
    ? getVariationEffectivePrice(defaultVariation, mode)
    : parseAmount(
        mode === "wholesaler"
          ? product.discount_price ?? product.price
          : product.price,
      );
  const originalPrice = defaultVariation
    ? parseAmount(defaultVariation.price)
    : parseAmount(product.price);
  const range = getProductPriceRange(product, mode);
  const hasRange = range.min < range.max;
  const hasDiscount =
    mode === "wholesaler" && currentPrice < originalPrice;

  return {
    currentPrice,
    originalPrice,
    range,
    hasRange,
    hasDiscount,
  };
};

const setSearchParam = (
  params: URLSearchParams,
  key: string,
  value: string | number | boolean | undefined,
) => {
  if (value === undefined) {
    return;
  }

  params.set(key, String(value));
};

export const getProducts = (params: GetProductsParams = {}) => {
  const searchParams = new URLSearchParams();

  setSearchParam(searchParams, "page", params.page);
  setSearchParam(searchParams, "limit", params.limit);
  setSearchParam(searchParams, "category_id", params.category_id);
  setSearchParam(searchParams, "price_min", params.price_min);
  setSearchParam(searchParams, "price_max", params.price_max);
  setSearchParam(searchParams, "rating_min", params.rating_min);
  setSearchParam(searchParams, "sort_price", params.sort_price);
  setSearchParam(searchParams, "new_arrival", params.new_arrival);
  setSearchParam(searchParams, "best_seller", params.best_seller);

  const query = searchParams.toString();

  return apiRequest<GetProductsResponse>(
    query ? `/product/all?${query}` : "/product/all",
    {
      method: "GET",
      token: null,
    },
  );
};

export const searchProducts = ({ q, page, limit }: SearchProductsParams) => {
  const searchParams = new URLSearchParams();
  const normalizedQuery = q.trim();

  searchParams.set("q", normalizedQuery);

  if (page && page > 0) {
    searchParams.set("page", String(page));
  }

  if (limit && limit > 0) {
    searchParams.set("limit", String(limit));
  }

  return apiRequest<SearchProductsResponse>(
    `/search/products?${searchParams.toString()}`,
    {
      method: "GET",
      token: null,
    },
  );
};
