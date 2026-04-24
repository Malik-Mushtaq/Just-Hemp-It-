import { apiRequest } from "@/lib/api/client";

export interface ApplyCouponItem {
  variation_id: number;
  quantity: number;
}

export interface ApplyCouponPayload {
  items?: ApplyCouponItem[];
  coupon_code?: string;
  code?: string;
  subtotal?: number;
}

export interface ApplyCouponData {
  original_total: number;
  discount_amount: number;
  final_total: number;
  shipping_fee: number;
  coupon_code: string;
}

export interface ApplyCouponResponse {
  message?: string;
  msg?: string;
  error?: string;
  coupon?: {
    id?: string;
    code?: string;
    discount_type?: string;
  };
  discount_amount?: number;
  final_subtotal?: number;
  data?: ApplyCouponData;
}

export const applyCoupon = (payload: ApplyCouponPayload) =>
  apiRequest<ApplyCouponResponse>("/api/coupons/apply", {
    method: "POST",
    body: {
      code: payload.code ?? payload.coupon_code,
      subtotal: payload.subtotal ?? 0,
    },
  });
