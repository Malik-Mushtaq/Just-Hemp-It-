import { apiRequest } from "@/lib/api/client";

export interface CartItem {
  cart_item_id?: number;
  product_id: number;
  variation_id: number;
  product_name: string;
  variation_name?: string | null;
  quantity: number;
  minimum_order_quantity?: number | string | null;
  min_order_quantity?: number | string | null;
  minimum_qty?: number | string | null;
  min_qty?: number | string | null;
  moq?: number | string | null;
  price: number | string;
  original_price: number | string;
  subtotal: number | string;
  available_stock?: number | null;
  status?: boolean | null;
  image?: string | null;
}

export interface CartResponse {
  msg: string;
  cart_id: number;
  cart_items: CartItem[];
  subtotal: number | string;
  discount_amount: number | string;
  shipping_fee: number | string;
  final_total: number | string;
  applied_coupon?: string | null;
  cached?: boolean;
}

export interface CartAddItem {
  product_id: number;
  variation_id: number;
  quantity: number;
}

export interface CartAddPayload {
  items: CartAddItem[];
  coupon_code?: string;
}

export interface CartAddResponse {
  msg: string;
  message?: string;
  coupon_msg?: string;
  cart_id: number;
  cart_items?: CartItem[];
  subtotal: number | string;
  discount_amount: number | string;
  shipping_fee: number | string;
  final_total: number | string;
  applied_coupon?: string | null;
  temp_user_token?: string;
}

export interface PurchasedItem {
  product_id: number;
  product_name: string;
  quantity: number;
  price: number;
}

export interface OutOfStockItem {
  product_name: string;
  requested: number;
  available: number;
}

export interface CheckoutSuccessResponse {
  msg: string;
  cart_id: number;
  order_id: string;
  items_count: number;
  total: number;
  product_ids: number[];
  purchased_items: PurchasedItem[];
  status: true;
}

export interface CheckoutFailureResponse {
  msg: string;
  out_of_stock: OutOfStockItem[];
  status: false;
}

export type CheckoutResponse =
  | CheckoutSuccessResponse
  | CheckoutFailureResponse;

export const getCart = () =>
  apiRequest<CartResponse>("/cart/get", {
    method: "GET",
  });

export const addToCart = (payload: CartAddPayload) =>
  apiRequest<CartAddResponse>("/cart/add", {
    method: "POST",
    body: payload,
  });

export interface CheckoutPayload {
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  street_address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

export const checkoutCart = (payload?: CheckoutPayload) =>
  apiRequest<CheckoutResponse>("/purchase/checkout", {
    method: "POST",
    body: payload || {},
  });
