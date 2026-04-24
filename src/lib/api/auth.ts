import { apiRequest } from "@/lib/api/client";
import {
  DEMO_PASSWORD,
  RETAILER_DEMO_EMAIL,
  WHOLESALER_DEMO_EMAIL,
} from "@/lib/authAudience";

export interface AuthUser {
  id: string | number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  phone?: string | null;
  business_name?: string | null;
  street1?: string;
  street1nr?: string;
  postcode?: string;
  city?: string;
  state?: string;
  country?: string;
  full_address?: string;
  latitude?: number;
  longitude?: number;
  w3w_address?: string;
  date_of_birth?: string;
  gender?: string;
  approval_status?: "pending" | "approved" | "rejected";
  is_active?: boolean;
  approved_at?: string | null;
  created_at?: string;
  updated_at?: string | null;
}

type AuthEnvelopeUser = {
  id?: string | number;
  email?: string;
  role?: string;
  approval_status?: "pending" | "approved" | "rejected";
  first_name?: string;
  last_name?: string | null;
  business_name?: string | null;
  phone?: string | null;
  is_active?: boolean;
  approved_at?: string | null;
  created_at?: string;
  updated_at?: string | null;
};

type AuthEnvelope = {
  message?: string;
  token?: string;
  data?: AuthEnvelopeUser;
  user?: AuthEnvelopeUser;
};

export interface RetailerSignUpPayload {
  first_name: string;
  last_name?: string;
  email: string;
  password: string;
  phone?: string;
}

export interface WholesalerSignUpPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  business_name: string;
  dba_name?: string;
  address1: string;
  address2?: string;
  country: string;
  state: string;
  city: string;
  zip: string;
  hear_about?: string;
  refer_by?: string;
  sales_tax_certificate: File;
  fein: File;
  license: File;
  void_cheque: File;
  state_id: File;
}

export interface SignUpResponse {
  message: string;
  user: AuthUser;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface GoogleVerifyPayload {
  idToken: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: AuthUser;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface MessageResponse {
  message: string;
}

const normalizeUser = (user?: AuthEnvelopeUser | null): AuthUser => ({
  id: user?.id ?? "",
  first_name: user?.first_name?.trim() || "",
  last_name: user?.last_name?.trim() || "",
  email: user?.email?.trim().toLowerCase() || "",
  role: user?.role?.trim() || "retailer",
  phone: user?.phone ?? null,
  business_name: user?.business_name ?? null,
  approval_status: user?.approval_status,
  is_active: user?.is_active,
  approved_at: user?.approved_at,
  created_at: user?.created_at,
  updated_at: user?.updated_at ?? null,
});

const normalizeAuthResponse = (response: AuthEnvelope): LoginResponse => ({
  message: response.message || "Login successful.",
  token: response.token || "",
  user: normalizeUser(response.data || response.user || null),
});

const normalizeSignUpResponse = (response: AuthEnvelope): SignUpResponse => ({
  message: response.message || "Account created successfully.",
  user: normalizeUser(response.data || response.user || null),
});

const buildDemoLoginResponse = (
  email: string,
  role: "retailer" | "wholesaler",
): LoginResponse => ({
  message:
    role === "wholesaler"
      ? "Welcome back to the wholesale portal."
      : "Welcome back to your retailer account.",
  token:
    role === "wholesaler"
      ? "demo-static-token-wholesaler-malik20mushtaqali-plus1"
      : "demo-static-token-retailer-malik20mushtaqali",
  user: {
    id: role === "wholesaler" ? 1002 : 1001,
    first_name: "Malik",
    last_name: "Ali",
    email,
    role,
  },
});

const toWholesalerFormData = (payload: WholesalerSignUpPayload) => {
  const formData = new FormData();

  formData.set("first_name", payload.first_name.trim());
  formData.set("last_name", payload.last_name.trim());
  formData.set("email", payload.email.trim().toLowerCase());
  formData.set("phone", payload.phone.trim());
  formData.set("business_name", payload.business_name.trim());
  formData.set("address1", payload.address1.trim());
  formData.set("country", payload.country.trim());
  formData.set("state", payload.state.trim());
  formData.set("city", payload.city.trim());
  formData.set("zip", payload.zip.trim());
  formData.set("sales_tax_certificate", payload.sales_tax_certificate);
  formData.set("fein", payload.fein);
  formData.set("license", payload.license);
  formData.set("void_cheque", payload.void_cheque);
  formData.set("state_id", payload.state_id);

  if (payload.dba_name?.trim()) {
    formData.set("dba_name", payload.dba_name.trim());
  }

  if (payload.address2?.trim()) {
    formData.set("address2", payload.address2.trim());
  }

  if (payload.hear_about?.trim()) {
    formData.set("hear_about", payload.hear_about.trim());
  }

  if (payload.refer_by?.trim()) {
    formData.set("refer_by", payload.refer_by.trim());
  }

  return formData;
};

export const signUp = async (payload: RetailerSignUpPayload) =>
  normalizeSignUpResponse(
    await apiRequest<AuthEnvelope>("/api/customer/signup", {
      method: "POST",
      body: payload,
      token: null,
    }),
  );

export const signUpWholesaler = async (payload: WholesalerSignUpPayload) =>
  normalizeSignUpResponse(
    await apiRequest<AuthEnvelope>("/api/wholesaler/signup", {
      method: "POST",
      body: toWholesalerFormData(payload),
      token: null,
    }),
  );

export const loginUser = async (payload: LoginPayload) => {
  const normalizedEmail = payload.email.trim().toLowerCase();
  const normalizedPassword = payload.password.trim();

  if (normalizedPassword === DEMO_PASSWORD) {
    if (normalizedEmail === RETAILER_DEMO_EMAIL) {
      return Promise.resolve(
        buildDemoLoginResponse(RETAILER_DEMO_EMAIL, "retailer"),
      );
    }

    if (normalizedEmail === WHOLESALER_DEMO_EMAIL) {
      return Promise.resolve(
        buildDemoLoginResponse(WHOLESALER_DEMO_EMAIL, "wholesaler"),
      );
    }
  }

  return normalizeAuthResponse(
    await apiRequest<AuthEnvelope>("/api/user/login", {
      method: "POST",
      body: {
        email: normalizedEmail,
        password: normalizedPassword,
      },
      token: null,
    }),
  );
};

export const verifyGoogleToken = async (payload: GoogleVerifyPayload) =>
  normalizeAuthResponse(
    await apiRequest<AuthEnvelope>("/api/auth/google/verify", {
      method: "POST",
      body: payload,
      token: null,
    }),
  );

export const forgotRetailerPassword = (payload: ForgotPasswordPayload) =>
  apiRequest<MessageResponse>("/api/user/forgot-password", {
    method: "POST",
    body: payload,
    token: null,
  });

export const forgotWholesalerPassword = (payload: ForgotPasswordPayload) =>
  apiRequest<MessageResponse>("/api/wholesaler/forgot-password", {
    method: "POST",
    body: payload,
    token: null,
  });
