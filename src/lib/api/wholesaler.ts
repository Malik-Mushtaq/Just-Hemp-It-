import { apiRequest } from "@/lib/api/client";
import { CartAddItem, CartResponse, CheckoutPayload, CheckoutResponse } from "@/lib/api/cart";
import { DashboardResponse, OrderHistoryResponse, OrderHistoryParams } from "@/lib/api/dashboard";
import { GetProductsParams, getWholesalerProducts, ProductItem } from "@/lib/api/product";

export const getWholesalerProductsList = (params: GetProductsParams = {}) =>
  getWholesalerProducts(params);

export const getWholesalerProductById = (id: string | number) =>
  apiRequest<ProductItem>(`/api/wholesaler/product/${encodeURIComponent(String(id))}`, {
    method: "GET",
  });

export const addToWholesalerCart = (payload: CartAddItem) =>
  apiRequest<CartResponse>("/api/wholesaler/cart/add", {
    method: "POST",
    body: {
      product_id: payload.product_id,
      variant_id: payload.variation_id,
      quantity: payload.quantity,
    },
  });

export const getWholesalerCart = () =>
  apiRequest<CartResponse>("/api/wholesaler/cart/get", {
    method: "GET",
  });

export const checkoutWholesalerCart = (payload?: CheckoutPayload) =>
  apiRequest<CheckoutResponse>("/api/wholesaler/purchase/checkout", {
    method: "POST",
    body: payload || {},
  });

export const getWholesalerDashboard = () =>
  apiRequest<DashboardResponse>("/api/wholesaler/dashboard", {
    method: "GET",
  });

export const getWholesalerOrderHistory = (params: OrderHistoryParams = {}) => {
  const searchParams = new URLSearchParams();

  if (params.page) {
    searchParams.set("page", String(params.page));
  }

  if (params.limit) {
    searchParams.set("limit", String(params.limit));
  }

  return apiRequest<OrderHistoryResponse>(
    searchParams.toString()
      ? `/api/wholesaler/order-history?${searchParams.toString()}`
      : "/api/wholesaler/order-history",
    {
      method: "GET",
    },
  );
};
