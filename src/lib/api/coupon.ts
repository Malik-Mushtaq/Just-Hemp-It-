import { apiRequest } from "@/lib/api/client";

export interface ApplyCouponItem {
  variation_id: number;
  quantity: number;
}

export interface ApplyCouponPayload {
  items: ApplyCouponItem[];
  coupon_code: string;
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
  data?: ApplyCouponData;
}

export const applyCoupon = (payload: ApplyCouponPayload) =>
  apiRequest<ApplyCouponResponse>("/coupons/apply", {
    method: "POST",
    body: payload,
  });
