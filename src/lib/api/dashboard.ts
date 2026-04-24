import { apiRequest, getApiAudience } from "@/lib/api/client";

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
  product_id: number | string;
  variation_id: number | string;
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

type DashboardApiOrder = {
  id?: string;
  order_id?: string;
  order_number?: number;
  status?: string;
  total?: number;
  total_amount?: number;
  created_at?: string;
  items?: Array<{
    product_id?: string | number;
    variant_id?: string | number;
    quantity?: number;
    price?: number;
    product_name?: string;
    variation_name?: string;
  }>;
};

type DashboardApiResponse = {
  stats?: {
    total_orders?: number;
    total_spent?: number;
    last_order_at?: string | null;
  };
  recent_orders?: DashboardApiOrder[];
};

type OrderHistoryApiResponse = {
  orders?: DashboardApiOrder[];
};

const formatDisplayDate = (value?: string | null) => {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const normalizeOrder = (order: DashboardApiOrder): OrderHistoryItem => ({
  order_id:
    order.order_id ||
    order.id ||
    (order.order_number ? `#${order.order_number}` : "Order"),
  status: order.status || "Pending",
  date: formatDisplayDate(order.created_at),
  items_count: order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0,
  products: (order.items || []).map((item) => ({
    product_id: item.product_id ?? "",
    variation_id: item.variant_id ?? "",
    product_name: item.product_name || "Product",
    variation_name: item.variation_name || "",
    quantity: item.quantity || 0,
    price: item.price || 0,
  })),
  total: order.total_amount ?? order.total ?? 0,
});

export const getDashboard = async () => {
  const response = await apiRequest<DashboardApiResponse>(
    getApiAudience() === "wholesaler"
      ? "/api/wholesaler/dashboard"
      : "/api/dashboard",
    {
      method: "GET",
    },
  );

  const recentOrders = (response.recent_orders || []).map((order) => {
    const normalized = normalizeOrder(order);

    return {
      order_id: normalized.order_id,
      date: normalized.date,
      items: normalized.items_count,
      total: normalized.total,
      status: normalized.status,
    };
  });

  return {
    total_orders: response.stats?.total_orders ?? 0,
    total_spent: response.stats?.total_spent ?? 0,
    recent_order: recentOrders[0]?.order_id || null,
    recent_orders: recentOrders,
  };
};

export const getOrderHistory = async (params: OrderHistoryParams = {}) => {
  const searchParams = new URLSearchParams();

  if (params.page && params.page > 0) {
    searchParams.set("page", String(params.page));
  }

  if (params.limit && params.limit > 0) {
    searchParams.set("limit", String(params.limit));
  }

  const query = searchParams.toString();
  const response = await apiRequest<OrderHistoryApiResponse>(
    getApiAudience() === "wholesaler"
      ? query
        ? `/api/wholesaler/order-history?${query}`
        : "/api/wholesaler/order-history"
      : query
        ? `/api/order-history?${query}`
        : "/api/order-history",
    {
      method: "GET",
    },
  );

  return {
    msg: "Order history loaded successfully.",
    page: params.page || 1,
    limit: params.limit || response.orders?.length || 0,
    total: response.orders?.length || 0,
    totalPages: 1,
    orders: (response.orders || []).map(normalizeOrder),
  };
};
