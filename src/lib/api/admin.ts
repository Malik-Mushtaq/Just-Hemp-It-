import { apiRequest } from "@/lib/api/client";

export interface Pagination {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}

export interface AdminListResponse<T = Record<string, unknown>> {
  data?: T[];
  pagination?: Pagination;
  message?: string;
}

export interface AdminMutationResponse<T = Record<string, unknown>> {
  message?: string;
  data?: T;
}

export interface AdminLoginResponse {
  message?: string;
  token?: string;
  data?: Record<string, unknown>;
}

export interface ApprovalRequest {
  approval_status: "pending" | "approved" | "rejected";
  note?: string;
}

const withQuery = (path: string, params?: Record<string, string | number | undefined>) => {
  const searchParams = new URLSearchParams();

  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();
  return query ? `${path}?${query}` : path;
};

export const adminSignUp = (payload: {
  email: string;
  password: string;
  first_name: string;
  last_name?: string;
}) =>
  apiRequest<AdminMutationResponse>("/api/admin/auth/signup", {
    method: "POST",
    body: payload,
    token: null,
  });

export const adminLogin = (payload: { email: string; password: string }) =>
  apiRequest<AdminLoginResponse>("/api/admin/auth/login", {
    method: "POST",
    body: payload,
    token: null,
  });

export const adminForgotPassword = (payload: { email: string }) =>
  apiRequest<AdminMutationResponse>("/api/admin/auth/forgot-password", {
    method: "POST",
    body: payload,
    token: null,
  });

export const adminLogout = () =>
  apiRequest<AdminMutationResponse>("/api/admin/auth/logout", {
    method: "POST",
  });

export const getAdminSession = () =>
  apiRequest<AdminMutationResponse>("/api/admin/auth/me", {
    method: "GET",
  });

export const getAdminDashboard = () =>
  apiRequest<AdminMutationResponse>("/api/admin/dashboard", {
    method: "GET",
  });

export const getAdminReportsOverview = (months?: number) =>
  apiRequest<AdminMutationResponse>(
    withQuery("/api/admin/reports/overview", { months }),
    {
      method: "GET",
    },
  );

export const getAdminProducts = () =>
  apiRequest<AdminListResponse>("/api/admin/products", {
    method: "GET",
  });

export const createAdminProduct = (payload: Record<string, unknown>) =>
  apiRequest<AdminMutationResponse>("/api/admin/products", {
    method: "POST",
    body: payload,
  });

export const getAdminProduct = (id: string) =>
  apiRequest<AdminMutationResponse>(`/api/admin/products/${encodeURIComponent(id)}`, {
    method: "GET",
  });

export const updateAdminProduct = (id: string, payload: Record<string, unknown>) =>
  apiRequest<AdminMutationResponse>(`/api/admin/products/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: payload,
  });

export const deleteAdminProduct = (id: string) =>
  apiRequest<AdminMutationResponse>(`/api/admin/products/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

export const getAdminCategories = () =>
  apiRequest<AdminListResponse>("/api/admin/categories", {
    method: "GET",
  });

export const createAdminCategory = (payload: Record<string, unknown>) =>
  apiRequest<AdminMutationResponse>("/api/admin/categories", {
    method: "POST",
    body: payload,
  });

export const updateAdminCategory = (id: string, payload: Record<string, unknown>) =>
  apiRequest<AdminMutationResponse>(`/api/admin/categories/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: payload,
  });

export const deleteAdminCategory = (id: string) =>
  apiRequest<AdminMutationResponse>(`/api/admin/categories/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

export const getAdminOrders = () =>
  apiRequest<AdminListResponse>("/api/admin/orders", {
    method: "GET",
  });

export const getAdminOrder = (id: string) =>
  apiRequest<AdminMutationResponse>(`/api/admin/orders/${encodeURIComponent(id)}`, {
    method: "GET",
  });

export const updateAdminOrderStatus = (id: string, payload: { status: string }) =>
  apiRequest<AdminMutationResponse>(`/api/admin/orders/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body: payload,
  });

export const getAdminOrderInvoice = (id: string) =>
  apiRequest<AdminMutationResponse>(`/api/admin/orders/${encodeURIComponent(id)}/invoice`, {
    method: "GET",
  });

export const getAdminCustomers = () =>
  apiRequest<AdminListResponse>("/api/admin/customers", {
    method: "GET",
  });

export const getAdminCustomer = (id: string) =>
  apiRequest<AdminMutationResponse>(`/api/admin/customers/${encodeURIComponent(id)}`, {
    method: "GET",
  });

export const getAdminWholesalers = () =>
  apiRequest<AdminListResponse>("/api/admin/wholesalers", {
    method: "GET",
  });

export const updateAdminWholesalerStatus = (id: string, payload: ApprovalRequest) =>
  apiRequest<AdminMutationResponse>(`/api/admin/wholesalers/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body: payload,
  });

export const deleteAdminWholesaler = (id: string) =>
  apiRequest<AdminMutationResponse>(`/api/admin/wholesalers/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

export const getAdminPromocodes = () =>
  apiRequest<AdminListResponse>("/api/admin/promocodes", {
    method: "GET",
  });

export const createAdminPromocode = (payload: Record<string, unknown>) =>
  apiRequest<AdminMutationResponse>("/api/admin/promocodes", {
    method: "POST",
    body: payload,
  });

export const updateAdminPromocode = (id: string, payload: Record<string, unknown>) =>
  apiRequest<AdminMutationResponse>(`/api/admin/promocodes/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: payload,
  });

export const deleteAdminPromocode = (id: string) =>
  apiRequest<AdminMutationResponse>(`/api/admin/promocodes/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

export const getAdminSubscribers = () =>
  apiRequest<AdminListResponse>("/api/admin/subscribers", {
    method: "GET",
  });

export const exportAdminSubscribers = () =>
  apiRequest<string>("/api/admin/subscribers/export", {
    method: "GET",
    headers: {
      Accept: "text/csv",
    },
  });

export const getAdminBlogs = () =>
  apiRequest<AdminListResponse>("/api/admin/blogs", {
    method: "GET",
  });

export const createAdminBlog = (payload: Record<string, unknown>) =>
  apiRequest<AdminMutationResponse>("/api/admin/blogs", {
    method: "POST",
    body: payload,
  });

export const getAdminBlog = (id: string) =>
  apiRequest<AdminMutationResponse>(`/api/admin/blogs/${encodeURIComponent(id)}`, {
    method: "GET",
  });

export const updateAdminBlog = (id: string, payload: Record<string, unknown>) =>
  apiRequest<AdminMutationResponse>(`/api/admin/blogs/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: payload,
  });

export const deleteAdminBlog = (id: string) =>
  apiRequest<AdminMutationResponse>(`/api/admin/blogs/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

export const getAdminShippingRules = () =>
  apiRequest<AdminListResponse>("/api/admin/shipping-rules", {
    method: "GET",
  });

export const createAdminShippingRule = (payload: Record<string, unknown>) =>
  apiRequest<AdminMutationResponse>("/api/admin/shipping-rules", {
    method: "POST",
    body: payload,
  });

export const updateAdminShippingRule = (id: string, payload: Record<string, unknown>) =>
  apiRequest<AdminMutationResponse>(`/api/admin/shipping-rules/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: payload,
  });

export const deleteAdminShippingRule = (id: string) =>
  apiRequest<AdminMutationResponse>(`/api/admin/shipping-rules/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

export const getAdminProfile = () =>
  apiRequest<AdminMutationResponse>("/api/admin/profile", {
    method: "GET",
  });

export const updateAdminProfile = (payload: Record<string, unknown>) =>
  apiRequest<AdminMutationResponse>("/api/admin/profile", {
    method: "PATCH",
    body: payload,
  });

export const changeAdminPassword = (payload: {
  current_password: string;
  new_password: string;
}) =>
  apiRequest<AdminMutationResponse>("/api/admin/change-password", {
    method: "POST",
    body: payload,
  });

export const getAdminNotifications = () =>
  apiRequest<AdminListResponse>("/api/admin/notifications", {
    method: "GET",
  });

export const markAdminNotificationRead = (id: string) =>
  apiRequest<AdminMutationResponse>(`/api/admin/notifications/${encodeURIComponent(id)}/read`, {
    method: "PATCH",
  });
