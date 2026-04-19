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
}

export interface AuthUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  street1?: string;
  street1nr?: string;
  postcode?: string;
  city?: string;
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

export const updateProfile = (payload: UpdateProfilePayload) =>
  apiRequest<UpdateProfileResponse>("/user/update-profile", {
    method: "PATCH",
    body: payload,
  });

export const getUserProfile = (userId?: number) =>
  apiRequest<GetUserProfileResponse>(
    userId ? `/user/profile?id=${userId}` : "/user/profile",
    {
      method: "GET",
    },
  );

export const changePassword = (payload: ChangePasswordPayload) =>
  apiRequest<ChangePasswordResponse>("/user/change-password", {
    method: "POST",
    body: payload,
  });
