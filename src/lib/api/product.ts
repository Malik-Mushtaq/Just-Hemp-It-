import { apiRequest, getApiAudience } from "@/lib/api/client";

export type ProductSortPrice = "asc" | "desc";
export type ProductPricingMode = "retailer" | "wholesaler";

export interface ProductVariation {
  variation_id: string | number;
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
  product_id: string | number;
  user_id: number;
  user_name: string;
  rating: number;
  review_text: string;
  created_at: string;
  updated_at?: string;
}

export interface ProductItem {
  id: string | number;
  product_id?: string;
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
  category_id?: string | number;
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

type ProductVariantApi = {
  id?: number | string;
  variant_id?: number | string;
  variation_id?: number | string;
  title?: string;
  name?: string;
  variation_name?: string;
  price?: number;
  original_price?: number | null;
  compare_at_price?: number | null;
  discounted_price?: number | null;
  stock?: number;
  available_stock?: number | null;
  min_order_qty_retail?: number | null;
  min_order_qty_wholesale?: number | null;
  min_order_value_wholesale?: number | null;
};

type ProductApi = {
  id?: number | string;
  product_id?: number | string;
  slug?: string;
  title?: string;
  name?: string;
  description?: string | null;
  short_description?: string | null;
  image?: string | null;
  main_image_url?: string | null;
  support_images?: string[] | null;
  status?: string | null;
  category?: string | null;
  category_name?: string | null;
  price?: number;
  original_price?: number | null;
  compare_at_price?: number | null;
  discounted_price?: number | null;
  discount_percentage?: number | null;
  min_order_qty_retail?: number | null;
  min_order_qty_wholesale?: number | null;
  min_order_value_wholesale?: number | null;
  variants?: ProductVariantApi[];
  audience?: string | null;
  created_at?: string;
  updated_at?: string;
};

type ProductsApiResponse = {
  data?: ProductApi[];
  totalProducts?: number;
  totalPages?: number;
  currentPage?: number;
  perPage?: number;
};

type ProductDetailApiResponse = ProductApi;

const parseAmount = (value: unknown) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
};

const parseEntityId = (value: unknown, fallback: string | number) => {
  if (typeof value === "string") {
    const normalized = value.trim();
    return normalized.length ? normalized : fallback;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  return fallback;
};

const toSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

const normalizeVariation = (
  variation: ProductVariantApi,
  index: number,
  baseProduct: ProductApi,
): ProductVariation => {
  const minimumOrderQuantity =
    variation.min_order_qty_wholesale ??
    variation.min_order_qty_retail ??
    baseProduct.min_order_qty_wholesale ??
    baseProduct.min_order_qty_retail ??
    1;

  return {
    variation_id: parseEntityId(
      variation.variation_id ?? variation.variant_id ?? variation.id,
      index + 1,
    ),
    variation_name:
      variation.variation_name || variation.title || variation.name || "Default",
    price: parseAmount(
      variation.original_price ??
        variation.compare_at_price ??
        variation.price ??
        baseProduct.original_price ??
        baseProduct.compare_at_price ??
        baseProduct.price,
    ),
    discounted_price: parseAmount(
      variation.discounted_price ??
        baseProduct.discounted_price ??
        variation.price ??
        baseProduct.price,
    ),
    minimum_order_quantity: minimumOrderQuantity,
    min_order_quantity: minimumOrderQuantity,
    moq: minimumOrderQuantity,
    stock: parseAmount(variation.available_stock ?? variation.stock),
    available_stock: variation.available_stock ?? variation.stock ?? 0,
  };
};

const normalizeProduct = (product: ProductApi, index: number): ProductItem => {
  const productName = product.title || product.name || "Product";
  const variations = (product.variants || []).map((variation, variationIndex) =>
    normalizeVariation(variation, variationIndex, product),
  );
  const primaryVariation = variations[0];
  const minimumOrderQuantity =
    product.min_order_qty_wholesale ??
    product.min_order_qty_retail ??
    primaryVariation?.minimum_order_quantity ??
    1;

  return {
    id: parseEntityId(product.id ?? product.product_id, index + 1),
    product_id:
      typeof product.product_id === "string"
        ? product.product_id.trim() || undefined
        : typeof product.id === "string"
          ? product.id.trim() || undefined
          : undefined,
    slug: product.slug || toSlug(productName),
    product_name: productName,
    price: parseAmount(
      primaryVariation?.price ??
        product.original_price ??
        product.compare_at_price ??
        product.price,
    ),
    minimum_order_quantity: minimumOrderQuantity,
    min_order_quantity: minimumOrderQuantity,
    moq: minimumOrderQuantity,
    discount_percentage: parseAmount(product.discount_percentage),
    discount_price: parseAmount(product.discounted_price),
    sold_count: 0,
    description: product.description || product.short_description || null,
    category_id: 0,
    category_name: product.category_name || product.category || null,
    status: product.status || "active",
    main_img: product.image || product.main_image_url || null,
    support_imgs: product.support_images || [],
    avg_rating: 0,
    main_variation_name: primaryVariation?.variation_name || null,
    variations,
    reviews: [],
    created_at: product.created_at,
    updated_at: product.updated_at,
  };
};

export const getMinimumOrderQuantity = (value: unknown) => {
  if (!value || typeof value !== "object") {
    return 1;
  }

  const source = value as Record<string, unknown>;
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
  parseAmount(variation.discounted_price ?? variation.price);

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
    product.discount_price ?? product.price,
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
        product.discount_price ?? product.price,
      );
  const originalPrice = defaultVariation
    ? parseAmount(defaultVariation.price)
    : parseAmount(product.price);
  const range = getProductPriceRange(product, mode);
  const hasRange = range.min < range.max;
  const hasDiscount = currentPrice < originalPrice;

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

export const getProducts = async (params: GetProductsParams = {}) => {
  const isWholesaler = getApiAudience() === "wholesaler";
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
  const response = await apiRequest<ProductsApiResponse>(
    isWholesaler
      ? query
        ? `/api/wholesaler/products?${query}`
        : "/api/wholesaler/products"
      : query
        ? `/api/product/all?${query}`
        : "/api/product/all",
    {
      method: "GET",
      token: isWholesaler ? undefined : null,
    },
  );

  return {
    message: "Products loaded successfully.",
    page: response.currentPage ?? params.page ?? 1,
    limit: response.perPage ?? params.limit ?? response.data?.length ?? 0,
    total_products: response.totalProducts ?? response.data?.length ?? 0,
    total_pages: response.totalPages ?? 1,
    products: (response.data || []).map(normalizeProduct),
  };
};

export const searchProducts = async ({ q, page, limit }: SearchProductsParams) => {
  const result = await getProducts({ page, limit });
  const normalizedQuery = q.trim().toLowerCase();
  const products = result.products.filter((product) => {
    const haystack = [
      product.product_name,
      product.description,
      product.category_name,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });

  return {
    ...result,
    q,
    total_products: products.length,
    total_pages: 1,
    products,
  };
};

export const getProductById = async (id: string | number) =>
  normalizeProduct(
    await apiRequest<ProductDetailApiResponse>(
      getApiAudience() === "wholesaler"
        ? `/api/wholesaler/product/${encodeURIComponent(String(id))}`
        : `/api/product/${encodeURIComponent(String(id))}`,
      {
        method: "GET",
        token: getApiAudience() === "wholesaler" ? undefined : null,
      },
    ),
    0,
  );

export const getWholesalerProducts = async (params: GetProductsParams = {}) => {
  const searchParams = new URLSearchParams();

  setSearchParam(searchParams, "page", params.page);
  setSearchParam(searchParams, "limit", params.limit);

  const query = searchParams.toString();
  const response = await apiRequest<ProductsApiResponse>(
    query
      ? `/api/wholesaler/products?${query}`
      : "/api/wholesaler/products",
    {
      method: "GET",
    },
  );

  return {
    message: "Products loaded successfully.",
    page: response.currentPage ?? params.page ?? 1,
    limit: response.perPage ?? params.limit ?? response.data?.length ?? 0,
    total_products: response.totalProducts ?? response.data?.length ?? 0,
    total_pages: response.totalPages ?? 1,
    products: (response.data || []).map(normalizeProduct),
  };
};
