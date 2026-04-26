import { isDemoToken } from "@/lib/authAudience";

const DEFAULT_API_BASE_URL = "https://backend.justhempit.co.uk";

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL
).replace(/\/+$/, "");

export type ApiAudience = "guest" | "retailer" | "wholesaler";

export type ApiFieldErrors = Record<string, string>;

type ApiValidationIssue = {
  path?: string;
  param?: string;
  msg?: string;
  message?: string;
};

type ApiErrorPayload = {
  msg?: string;
  message?: string;
  error?: string;
  details?: string;
  errors?: ApiValidationIssue[];
};

type ApiRequestOptions = Omit<RequestInit, "body" | "headers"> & {
  body?: BodyInit | object | null;
  headers?: HeadersInit;
  token?: string | null;
};

let apiTokenProvider: (() => string | null) | null = null;
let apiUnauthorizedHandler: ((status: number) => void) | null = null;
let apiAudienceProvider: (() => ApiAudience) | null = null;

const AUTH_STORAGE_KEY = "hempit.auth.session";

export const setApiTokenProvider = (provider: (() => string | null) | null) => {
  apiTokenProvider = provider;
};

export const setApiUnauthorizedHandler = (
  handler: ((status: number) => void) | null,
) => {
  apiUnauthorizedHandler = handler;
};

export const setApiAudienceProvider = (
  provider: (() => ApiAudience) | null,
) => {
  apiAudienceProvider = provider;
};

export const getApiAudience = (): ApiAudience =>
  apiAudienceProvider?.() ||
  (() => {
    if (typeof window === "undefined") {
      return "guest";
    }

    try {
      const rawSession = window.localStorage.getItem(AUTH_STORAGE_KEY);

      if (!rawSession) {
        return "guest";
      }

      const parsed = JSON.parse(rawSession) as {
        user?: {
          role?: unknown;
        };
      };
      const normalizedRole =
        typeof parsed.user?.role === "string"
          ? parsed.user.role.trim().toLowerCase()
          : "";

      return normalizedRole === "wholesaler" || normalizedRole === "wholesale"
        ? "wholesaler"
        : "retailer";
    } catch {
      return "guest";
    }
  })();

export class ApiError extends Error {
  status: number;
  fieldErrors: ApiFieldErrors;
  details?: string;

  constructor(
    message: string,
    status: number,
    fieldErrors: ApiFieldErrors = {},
    details?: string,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
    this.details = details;
  }
}

const buildUrl = (path: string) =>
  `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

const shouldSerializeJson = (body: ApiRequestOptions["body"]) => {
  if (body === null || body === undefined) {
    return false;
  }

  return !(
    body instanceof Blob ||
    body instanceof FormData ||
    body instanceof URLSearchParams ||
    typeof body === "string"
  );
};

const resolveAuthToken = (requestToken: string | null | undefined) => {
  if (typeof requestToken === "string") {
    return isDemoToken(requestToken) ? null : requestToken;
  }

  if (requestToken === null) {
    return null;
  }

  const providerToken = apiTokenProvider?.() || null;
  return isDemoToken(providerToken) ? null : providerToken;
};

const normalizeErrorResponse = (payload: unknown) => {
  if (typeof payload === "string" && payload.trim()) {
    const routeMissMatch = payload.match(/Cannot (GET|POST|PUT|PATCH|DELETE) ([^<\s]+)/i);

    if (routeMissMatch) {
      const [, method, path] = routeMissMatch;

      return {
        message: `Backend route unavailable: ${method.toUpperCase()} ${path}`,
        fieldErrors: {},
        details: payload,
      };
    }

    return {
      message: payload,
      fieldErrors: {},
      details: undefined,
    };
  }

  if (!payload || typeof payload !== "object") {
    return {
      message: "Something went wrong. Please try again.",
      fieldErrors: {},
      details: undefined,
    };
  }

  const errorPayload = payload as ApiErrorPayload;
  const fieldErrors = Array.isArray(errorPayload.errors)
    ? errorPayload.errors.reduce<ApiFieldErrors>((accumulator, issue) => {
        const field =
          typeof issue.path === "string"
            ? issue.path
            : typeof issue.param === "string"
              ? issue.param
              : undefined;
        const message =
          typeof issue.msg === "string"
            ? issue.msg
            : typeof issue.message === "string"
              ? issue.message
              : undefined;

        if (field && message && !accumulator[field]) {
          accumulator[field] = message;
        }

        return accumulator;
      }, {})
    : {};

  const fallbackMessage =
    Object.values(fieldErrors)[0] || "Something went wrong. Please try again.";

  return {
    message:
      (typeof errorPayload.message === "string" && errorPayload.message) ||
      (typeof errorPayload.msg === "string" && errorPayload.msg) ||
      (typeof errorPayload.error === "string" && errorPayload.error) ||
      fallbackMessage,
    fieldErrors,
    details:
      typeof errorPayload.details === "string"
        ? errorPayload.details
        : undefined,
  };
};

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { body, headers, token, ...requestOptions } = options;
  const requestHeaders = new Headers(headers);
  let requestBody: BodyInit | undefined;
  const resolvedToken = resolveAuthToken(token);

  if (!requestHeaders.has("Accept")) {
    requestHeaders.set("Accept", "application/json");
  }

  if (shouldSerializeJson(body)) {
    requestHeaders.set("Content-Type", "application/json");
    requestBody = JSON.stringify(body);
  } else if (body !== null && body !== undefined) {
    requestBody = body as BodyInit;
  }

  if (resolvedToken) {
    requestHeaders.set("Authorization", `Bearer ${resolvedToken}`);
  }

  const response = await fetch(buildUrl(path), {
    ...requestOptions,
    headers: requestHeaders,
    body: requestBody,
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json().catch(() => null)
    : await response.text().catch(() => "");

  if (!response.ok) {
    if (resolvedToken && (response.status === 401 || response.status === 403)) {
      apiUnauthorizedHandler?.(response.status);
    }

    const error = normalizeErrorResponse(payload);
    throw new ApiError(
      error.message,
      response.status,
      error.fieldErrors,
      error.details,
    );
  }

  return payload as T;
}
