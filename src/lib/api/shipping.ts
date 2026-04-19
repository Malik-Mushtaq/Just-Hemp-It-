export const LIVE_API_BASE_URL = "https://backend.justhempit.co.uk";

export interface ShippingRule {
  shipping_id: number;
  rule_name: string;
  description: string | null;
  min_order_amount: number | string;
  shipping_fee: number | string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface GetShippingRulesResponse {
  message: string;
  count: number;
  data: ShippingRule[];
}

export const getShippingRules = async (): Promise<GetShippingRulesResponse> => {
  const response = await fetch(
    `${LIVE_API_BASE_URL}/shipping-rules/get?status=active`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    },
  );

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json().catch(() => null)
    : await response.text().catch(() => "");

  if (!response.ok) {
    if (payload && typeof payload === "object") {
      const message =
        typeof (payload as { message?: unknown }).message === "string"
          ? (payload as { message: string }).message
          : typeof (payload as { msg?: unknown }).msg === "string"
            ? (payload as { msg: string }).msg
            : "Unable to load shipping rules right now.";

      throw new Error(message);
    }

    throw new Error("Unable to load shipping rules right now.");
  }

  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid shipping rules response.");
  }

  return payload as GetShippingRulesResponse;
};
