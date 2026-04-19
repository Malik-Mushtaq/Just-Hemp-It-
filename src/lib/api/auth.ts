import { apiRequest } from "@/lib/api/client";
import {
  DEMO_PASSWORD,
  RETAILER_DEMO_EMAIL,
  WHOLESALER_DEMO_EMAIL,
} from "@/lib/authAudience";

export interface AuthUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  created_at?: string;
}

export interface SignUpPayload {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role?: "user";
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

export const signUp = (payload: SignUpPayload) =>
  apiRequest<SignUpResponse>("/user/add", {
    method: "POST",
    body: payload,
  });

export const loginUser = (payload: LoginPayload) => {
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

  return apiRequest<LoginResponse>("/user/login", {
    method: "POST",
    body: payload,
  });
};

export const verifyGoogleToken = (payload: GoogleVerifyPayload) =>
  apiRequest<LoginResponse>("/auth/google/verify", {
    method: "POST",
    body: payload,
  });
