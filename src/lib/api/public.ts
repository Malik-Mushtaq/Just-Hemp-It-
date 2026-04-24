import { apiRequest } from "@/lib/api/client";
import { CheckoutAddress, CheckoutResponse } from "@/lib/api/cart";

export interface HealthResponse {
  ok?: boolean;
}

export interface MessageResponse {
  message?: string;
}

export interface ContactRequest {
  name: string;
  email: string;
  subject?: string;
  message: string;
}

export interface OrderHistoryByEmailRequest {
  email: string;
}

export interface OrderHistoryByEmailResponse {
  email?: string;
  orders?: Array<Record<string, unknown>>;
}

export interface PaymentInitRequest {
  amount: number;
  currency: string;
  payment_method: "card" | "google_pay" | "apple_pay";
  email?: string;
  items?: Array<{
    product_id: string | number;
    variant_id: string | number;
    quantity: number;
  }>;
  shipping_address?: CheckoutAddress;
  coupon_code?: string;
  notes?: string;
}

export interface PaymentInitResponse {
  success?: boolean;
  payment_session_id?: string;
  payment_method?: string;
  process_path?: string;
  jwt?: string;
  expires_at?: string | null;
}

export interface PaymentVerifyRequest {
  payment_session_id: string;
  jwt: string;
}

export interface PaymentVerifyResponse {
  success?: boolean;
  approved?: boolean;
  auto_checkout?: boolean;
  payment_session_id?: string;
  transaction_reference?: string | null;
  message?: string | null;
  amount?: string | null;
  currency?: string | null;
  checkout?: CheckoutResponse;
}

export interface InvoiceResponse {
  message?: string;
  data?: Record<string, unknown>;
}

export const getHealth = () =>
  apiRequest<HealthResponse>("/api/health", { method: "GET", token: null });

export const getApiHealth = () =>
  apiRequest<HealthResponse>("/api/health", { method: "GET", token: null });

export const submitContactForm = (payload: ContactRequest) =>
  apiRequest<MessageResponse>("/api/contact-us", {
    method: "POST",
    body: payload,
    token: null,
  });

export const initializePaymentSession = (payload: PaymentInitRequest) =>
  apiRequest<PaymentInitResponse>("/api/payments/jwt/init", {
    method: "POST",
    body: payload,
  });

export const verifyPaymentResponse = (payload: PaymentVerifyRequest) =>
  apiRequest<PaymentVerifyResponse>("/api/payments/response/verify", {
    method: "POST",
    body: payload,
  });

export const processCardPayment = (payload: PaymentVerifyRequest) =>
  apiRequest<PaymentVerifyResponse>("/api/payments/card/process", {
    method: "POST",
    body: payload,
  });

export const processGooglePayPayment = (payload: PaymentVerifyRequest) =>
  apiRequest<PaymentVerifyResponse>("/api/payments/googlepay/process", {
    method: "POST",
    body: payload,
  });

export const processApplePayPayment = (payload: PaymentVerifyRequest) =>
  apiRequest<PaymentVerifyResponse>("/api/payments/applepay/process", {
    method: "POST",
    body: payload,
  });

export const getGuestOrderHistoryByEmail = (payload: OrderHistoryByEmailRequest) =>
  apiRequest<OrderHistoryByEmailResponse>("/api/purchase/order-history-by-email", {
    method: "POST",
    body: payload,
    token: null,
  });

export const getInvoiceByOrderId = (id: string) =>
  apiRequest<InvoiceResponse>(`/api/invoice/${encodeURIComponent(id)}`, {
    method: "GET",
  });

export const getTrackingDetails = (trackingId: string) =>
  apiRequest<InvoiceResponse>(
    `/api/tracking/details?tracking_id=${encodeURIComponent(trackingId)}`,
    {
      method: "GET",
    },
  );
