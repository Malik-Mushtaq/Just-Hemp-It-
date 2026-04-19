import { API_BASE_URL } from "@/lib/api/client";

export interface InitPaymentSessionResponse {
  success?: boolean;
  paymentSessionId?: string;
  processPath?: string;
  jwt?: string;
  expiresAt?: string;
  message?: string;
}

export interface PaymentSessionMeta {
  paymentMethod: "CARD";
  paymentSessionId: string;
  requestReference: string;
  jwt: string;
  processPath?: string;
}

export interface PaymentDecision {
  isSuccess: boolean;
  isPending: boolean;
  message: string;
  errorcode?: string;
  approved: boolean;
  raw: unknown;
}

const PAYMENT_SESSION_KEY = "hempit.payment.session";

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (typeof value !== "object" || value === null) return null;
  return value as Record<string, unknown>;
};

const toText = (value: unknown): string | null => {
  if (typeof value === "string" && value.trim().length > 0) return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
};

export const getPaymentApiBaseUrl = (): string => API_BASE_URL;

export const persistPaymentSession = (meta: PaymentSessionMeta): void => {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(PAYMENT_SESSION_KEY, JSON.stringify(meta));
};

export const clearPaymentSession = (): void => {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(PAYMENT_SESSION_KEY);
};

export const derivePaymentDecision = (response: unknown): PaymentDecision => {
  const root = asRecord(response) ?? {};
  const nestedData = asRecord(root.data) ?? {};
  const gatewayResponse =
    asRecord(root.gatewayResponse) ??
    asRecord(nestedData.gatewayResponse) ??
    {};

  const merged: Record<string, unknown> = {
    ...gatewayResponse,
    ...nestedData,
    ...root,
  };

  const errorcode = toText(merged.errorcode) ?? undefined;
  const status = toText(merged.status)?.toUpperCase();
  const approvedFlag = merged.approved === true;
  const approvedByCode =
    errorcode === "0" || errorcode === "FULFILLMENT_PENDING";
  const approvedByStatus =
    status === "SUCCESS" ||
    status === "APPROVED" ||
    status === "FULFILLMENT_PENDING";
  const verifiedFlag = merged.verified === true;
  const successFlag = merged.success === true;

  const fulfillment = asRecord(merged.fulfillment);
  const pending =
    errorcode === "FULFILLMENT_PENDING" ||
    status === "FULFILLMENT_PENDING" ||
    fulfillment?.pending === true;

  const backendMessage = toText(merged.message);
  const hasSuccessText =
    typeof backendMessage === "string" &&
    /payment has been successfully processed|payment successful/i.test(
      backendMessage,
    );

  const isExplicitFailure =
    merged.success === false ||
    merged.approved === false ||
    merged.verified === false ||
    (typeof errorcode === "string" &&
      errorcode !== "0" &&
      errorcode !== "FULFILLMENT_PENDING");

  const approved =
    approvedFlag ||
    approvedByCode ||
    approvedByStatus ||
    verifiedFlag ||
    successFlag;
  const isSuccess = !isExplicitFailure && (approved || hasSuccessText);

  let message =
    backendMessage ?? (isSuccess ? "Payment successful." : "Payment failed.");
  if (isSuccess && pending && !backendMessage) {
    message = "Payment successful. Your order is being processed.";
  }

  return {
    isSuccess,
    isPending: isSuccess && pending,
    message,
    errorcode,
    approved,
    raw: response,
  };
};
