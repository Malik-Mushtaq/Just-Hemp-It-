import { apiRequest } from "@/lib/api/client";

export interface SubscribeNewsletterPayload {
  email: string;
}

export interface SubscribeNewsletterValidationIssue {
  path?: string;
  msg?: string;
}

export interface SubscribeNewsletterResponse {
  msg?: string;
  message?: string;
  errors?: SubscribeNewsletterValidationIssue[];
}

export const subscribeNewsletter = (payload: SubscribeNewsletterPayload) =>
  apiRequest<SubscribeNewsletterResponse>("/api/subscribe/news-letter", {
    method: "POST",
    body: payload,
    token: null,
  });
