import { apiRequest } from "@/lib/api/client";

export interface AddReviewPayload {
  product_id: string | number;
  user_name: string;
  rating: number;
  review_text?: string;
}

export interface ProductReview {
  review_id: number;
  product_id: string | number;
  user_id: number;
  user_name: string;
  rating: number;
  review_text?: string;
  created_at: string;
}

export interface AddReviewResponse {
  message: string;
  review: ProductReview;
}

export interface GetProductReviewsParams {
  page?: number;
  limit?: number;
}

export interface GetProductReviewsResponse {
  message: string;
  page: number;
  limit: number;
  total_reviews: number;
  total_pages: number;
  reviews: ProductReview[];
}

export const addReview = (payload: AddReviewPayload) =>
  apiRequest<AddReviewResponse>("/api/review/add", {
    method: "POST",
    body: payload,
  });

export const getProductReviews = (
  productId: string | number,
  params: GetProductReviewsParams = {},
) => {
  const searchParams = new URLSearchParams();

  if (params.page) {
    searchParams.set("page", String(params.page));
  }

  if (params.limit) {
    searchParams.set("limit", String(params.limit));
  }

  const query = searchParams.toString();

  return apiRequest<GetProductReviewsResponse>(
    query
      ? `/api/review/product/${productId}?${query}`
      : `/api/review/product/${productId}`,
    {
      method: "GET",
      token: null,
    },
  );
};
