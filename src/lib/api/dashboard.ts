import { apiRequest } from "@/lib/api/client";

export interface DashboardOrderSummary {
  order_id: string;
  date: string;
  items: number;
  total: number;
  status: string;
}

export interface DashboardResponse {
  total_orders: number;
  total_spent: number;
  recent_order: string | null;
  recent_orders: DashboardOrderSummary[];
}

export interface OrderHistoryItem {
  order_id: string;
  status: string;
  date: string;
  items_count: number;
  products: OrderHistoryProduct[];
  total: number;
}

export interface OrderHistoryProduct {
  product_id: number;
  variation_id: number;
  product_name: string;
  variation_name: string;
  quantity: number;
  price: number;
}

export interface OrderHistoryResponse {
  msg: string;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  orders: OrderHistoryItem[];
}

export interface OrderHistoryParams {
  page?: number;
  limit?: number;
}

export const getDashboard = () =>
  apiRequest<DashboardResponse>("/dashboard", {
    method: "GET",
  });

export const getOrderHistory = (params: OrderHistoryParams = {}) => {
  const searchParams = new URLSearchParams();

  if (params.page && params.page > 0) {
    searchParams.set("page", String(params.page));
  }

  if (params.limit && params.limit > 0) {
    searchParams.set("limit", String(params.limit));
  }

  const query = searchParams.toString();

  return apiRequest<OrderHistoryResponse>(
    query ? `/order-history?${query}` : "/order-history",
    {
      method: "GET",
    },
  );
};
