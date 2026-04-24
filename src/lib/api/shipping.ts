import { apiRequest } from "@/lib/api/client";

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

type ShippingRuleApiItem = {
  id?: number;
  shipping_id?: number;
  rule_name?: string;
  description?: string | null;
  min_order_amount?: number | string;
  shipping_fee?: number | string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

type ShippingRulesApiResponse = {
  data?: ShippingRuleApiItem[];
};

export const getShippingRules = async (): Promise<GetShippingRulesResponse> => {
  const response = await apiRequest<ShippingRulesApiResponse>(
    "/api/shipping-rules/get",
    {
      method: "GET",
      token: null,
    },
  );

  const data = (response.data || []).map((rule) => ({
    shipping_id: rule.shipping_id ?? rule.id ?? 0,
    rule_name: rule.rule_name || "Shipping Rule",
    description: rule.description ?? null,
    min_order_amount: rule.min_order_amount ?? 0,
    shipping_fee: rule.shipping_fee ?? 0,
    is_active: rule.is_active !== false,
    created_at: rule.created_at,
    updated_at: rule.updated_at,
  }));

  return {
    message: "Shipping rules loaded successfully.",
    count: data.length,
    data,
  };
};
