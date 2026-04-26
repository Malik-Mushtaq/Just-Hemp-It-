import { apiRequest } from "@/lib/api/client";

export interface UpdateProfilePayload {
  first_name?: string;
  last_name?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: "male" | "female" | "other";
  street1?: string;
  street1Nr?: string;
  postcode?: string;
  city?: string;
  country?: string;
  state?: string;
  address1?: string;
  address2?: string;
  zip?: string;
}

export interface AuthUser {
  id: string | number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
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
  role: string;
  created_at?: string;
  updated_at?: string;
}

type ShippingAddress = {
  line1?: string | null;
  line2?: string | null;
  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postal_code?: string | null;
  zip?: string | null;
  full_address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  w3w_words?: string | null;
};

type ProfileEnvelopeUser = {
  id?: string | number;
  first_name?: string;
  last_name?: string | null;
  email?: string;
  phone?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  role?: string;
  approval_status?: string | null;
  is_active?: boolean | null;
  approved_at?: string | null;
  created_at?: string;
  updated_at?: string | null;
};

type ProfileEnvelope = {
  message?: string;
  data?: ProfileEnvelopeUser & {
    shipping_address?: ShippingAddress;
  };
};

export interface GetUserProfileResponse {
  user: AuthUser;
  cached?: boolean;
}

export interface UpdateProfileResponse {
  message: string;
  user: AuthUser;
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
}

export interface ChangePasswordResponse {
  msg: string;
}

const normalizeProfileUser = (
  user?: ProfileEnvelope["data"],
): AuthUser => {
  const shipping = user?.shipping_address;

  return {
    id: user?.id ?? "",
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    street1: shipping?.address1 || shipping?.line1 || "",
    street1nr: "",
    postcode: shipping?.zip || shipping?.postal_code || "",
    city: shipping?.city || "",
    state: shipping?.state || "",
    country: shipping?.country || "",
    full_address: shipping?.full_address || "",
    latitude: shipping?.latitude ?? undefined,
    longitude: shipping?.longitude ?? undefined,
    w3w_address: shipping?.w3w_words || "",
    date_of_birth: user?.date_of_birth || "",
    gender: user?.gender || "",
    role: user?.role || "retailer",
    created_at: user?.created_at,
    updated_at: user?.updated_at || undefined,
  };
};

const toProfileUpdateRequest = (payload: UpdateProfilePayload) => ({
  first_name: payload.first_name,
  last_name: payload.last_name,
  phone: payload.phone,
  date_of_birth: payload.date_of_birth,
  gender: payload.gender,
  address1: payload.address1 ?? payload.street1,
  address2: payload.address2 ?? payload.street1Nr,
  city: payload.city,
  state: payload.state,
  country: payload.country,
  zip: payload.zip ?? payload.postcode,
});

export const formatProfileDateForInput = (value?: string | null) => {
  if (!value) {
    return "";
  }

  const isoDateMatch = value.match(/^(\d{4}-\d{2}-\d{2})/);

  if (isoDateMatch) {
    return isoDateMatch[1];
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return parsedDate.toISOString().slice(0, 10);
};

export const updateProfile = async (payload: UpdateProfilePayload) => {
  console.log("[profile:update] payload", payload);
  console.log("[profile:update] request", toProfileUpdateRequest(payload));

  const response = await apiRequest<ProfileEnvelope>("/api/user/update-profile", {
    method: "PATCH",
    body: toProfileUpdateRequest(payload),
  });

  console.log("[profile:update] response", response);

  return {
    message: response.message || "Profile updated successfully.",
    user: normalizeProfileUser(response.data),
  };
};

export const getUserProfile = async (_userId?: number | string) => {
  const response = await apiRequest<ProfileEnvelope>("/api/user/profile", {
    method: "GET",
  });

  console.log("[profile:get] raw response", response);
  console.log("[profile:get] normalized user", normalizeProfileUser(response.data));

  return {
    user: normalizeProfileUser(response.data),
    cached: false,
  };
};

export const changePassword = async (payload: ChangePasswordPayload) => {
  const response = await apiRequest<{ message?: string }>("/api/user/change-password", {
    method: "POST",
    body: payload,
  });

  return {
    msg: response.message || "Password changed successfully.",
  };
};
