import { API_BASE_URL, ApiError, apiRequest } from "@/lib/api/client";

export interface ReviewAddRequest {
  product_id: string;
  user_name: string;
  rating: number;
  review_text?: string;
}

export interface ReviewItem {
  review_id: string | number;
  product_id: string;
  user_id?: string | number;
  user_name: string;
  rating: number;
  review_text?: string;
  created_at: string;
  updated_at?: string;
}

export interface ReviewAddResponse {
  message?: string;
  review?: ReviewItem;
}

export interface ReviewListParams {
  product_id?: string;
  page?: number;
  limit?: number;
}

export interface ReviewsListResponse {
  message?: string;
  page?: number;
  limit?: number;
  total_reviews?: number;
  total_pages?: number;
  reviews: ReviewItem[];
}

export interface ReviewsByProductResponse extends ReviewsListResponse {}

export interface ReviewDeleteResponse {
  message?: string;
}

const buildReviewQuery = (params: ReviewListParams = {}) => {
  const searchParams = new URLSearchParams();

  if (params.product_id) {
    searchParams.set("product_id", params.product_id);
  }

  if (params.page) {
    searchParams.set("page", String(params.page));
  }

  if (params.limit) {
    searchParams.set("limit", String(params.limit));
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
};

export const addReview = (payload: ReviewAddRequest) =>
  (() => {
    const path = "/api/review/add";

    console.log("[review:add] url", `${API_BASE_URL}${path}`);
    console.log("[review:add] body", payload);

    return apiRequest<ReviewAddResponse>(path, {
      method: "POST",
      body: payload,
    });
  })();

export const getAllReviews = (params: ReviewListParams = {}) =>
  (() => {
    const path = `/api/review/all${buildReviewQuery(params)}`;

    console.log("[review:all] url", `${API_BASE_URL}${path}`);
    console.log("[review:all] params", params);

    return apiRequest<ReviewsListResponse>(path, {
      method: "GET",
      token: null,
    });
  })();

export const getProductReviews = (
  productId: string,
  params: Omit<ReviewListParams, "product_id"> = {},
) => {
  const path = `/api/review/product/${encodeURIComponent(productId)}${buildReviewQuery({
    product_id: productId,
    ...params,
  })}`;

  console.log("[review:product] url", `${API_BASE_URL}${path}`);
  console.log("[review:product] productId", productId);
  console.log("[review:product] params", {
    product_id: productId,
    ...params,
  });

  return apiRequest<ReviewsByProductResponse>(
    path,
    {
      method: "GET",
      token: null,
    },
  ).catch((error: unknown) => {
    if (error instanceof ApiError && error.status === 404) {
      return getAllReviews({
      product_id: productId,
      ...params,
      });
    }

    throw error;
  });
};

export const deleteOwnReview = (reviewId: string) =>
  apiRequest<ReviewDeleteResponse>(
    `/api/review/delete/${encodeURIComponent(reviewId)}`,
    {
      method: "DELETE",
    },
  );

export const deleteAdminReview = (reviewId: string) =>
  apiRequest<ReviewDeleteResponse>(
    `/api/review/admin/delete/${encodeURIComponent(reviewId)}`,
    {
      method: "DELETE",
    },
  );
