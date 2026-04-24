import { apiRequest, getApiAudience } from "@/lib/api/client";

export interface CartItem {
  cart_item_id?: number;
  product_id: string | number;
  variation_id: string | number;
  product_name: string;
  variation_name?: string | null;
  quantity: number;
  minimum_order_quantity?: number | string | null;
  min_order_quantity?: number | string | null;
  minimum_qty?: number | string | null;
  min_qty?: number | string | null;
  moq?: number | string | null;
  price: number | string;
  original_price: number | string;
  subtotal: number | string;
  available_stock?: number | null;
  status?: boolean | null;
  image?: string | null;
}

type CartSummary = {
  total_items?: number;
  subtotal?: number;
};

type CartUser = {
  id?: string;
  email?: string | null;
  role?: string;
};

type CartApiItem = {
  cart_item_id?: number;
  product_id?: string | number;
  variant_id?: string | number;
  variation_id?: string | number;
  product_name?: string;
  title?: string;
  name?: string;
  variation_name?: string | null;
  variant_name?: string | null;
  quantity?: number;
  price?: number | string;
  original_price?: number | string;
  subtotal?: number | string;
  image?: string | null;
  available_stock?: number | null;
  stock?: number | null;
  min_order_qty_wholesale?: number | null;
  min_order_qty_retail?: number | null;
};

type CartApiResponse = {
  items?: CartApiItem[];
  summary?: CartSummary;
  guest_token?: string | null;
  checkout_mode?: "guest" | "authenticated" | null;
  user?: CartUser;
  message?: string;
};

export interface CartResponse {
  msg: string;
  message?: string;
  cart_id: number;
  cart_items: CartItem[];
  subtotal: number | string;
  discount_amount: number | string;
  shipping_fee: number | string;
  final_total: number | string;
  applied_coupon?: string | null;
  guest_token?: string | null;
  checkout_mode?: "guest" | "authenticated" | null;
  user?: CartUser;
  cached?: boolean;
}

export interface CartAddItem {
  product_id: string | number;
  variation_id: string | number;
  quantity: number;
  email?: string;
}

export interface CartAddPayload {
  items: CartAddItem[];
  coupon_code?: string;
  email?: string;
}

export interface CartAddResponse extends CartResponse {
  coupon_msg?: string;
  temp_user_token?: string;
}

export interface CheckoutAddress {
  line1?: string;
  line2?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  zip?: string;
}

export interface CheckoutLineItem {
  product_id: string | number;
  variant_id: string | number;
  quantity: number;
}

export interface CheckoutPayload {
  email?: string;
  items?: CheckoutLineItem[];
  payment_method?: "card" | "google_pay" | "apple_pay" | "bank_transfer" | "cod";
  payment_session_id?: string;
  notes?: string;
  coupon_code?: string;
  shipping_address?: CheckoutAddress;
  first_name?: string;
  last_name?: string;
  phone?: string;
  street_address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

export interface CheckoutResponse {
  message: string;
  checkout_mode?: "guest" | "authenticated";
  email?: string;
  shipping_address?: CheckoutAddress;
  order?: {
    id?: string;
    order_number?: number;
    tracking_id?: string | null;
    invoice_no?: string;
    total_amount?: number;
    status?: string;
    payment_status?: string;
    created_at?: string;
  };
  totals?: {
    subtotal?: number;
    discount?: number;
    shipping?: number;
    total?: number;
  };
}

const toEntityId = (value: unknown) => {
  if (typeof value === "string") {
    const normalized = value.trim();
    return normalized.length ? normalized : "";
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  return "";
};

const normalizeItem = (item: CartApiItem): CartItem => ({
  cart_item_id: item.cart_item_id,
  product_id: toEntityId(item.product_id),
  variation_id: toEntityId(item.variant_id ?? item.variation_id),
  product_name: item.product_name || item.title || item.name || "Product",
  variation_name: item.variation_name ?? item.variant_name ?? null,
  quantity: item.quantity ?? 0,
  minimum_order_quantity:
    item.min_order_qty_wholesale ?? item.min_order_qty_retail ?? null,
  min_order_quantity:
    item.min_order_qty_wholesale ?? item.min_order_qty_retail ?? null,
  price: item.price ?? 0,
  original_price: item.original_price ?? item.price ?? 0,
  subtotal:
    item.subtotal ?? Number(item.price ?? 0) * Number(item.quantity ?? 0),
  available_stock: item.available_stock ?? item.stock ?? null,
  status: true,
  image: item.image ?? null,
});

const normalizeCartResponse = (response: CartApiResponse): CartResponse => {
  const cartItems = (response.items || []).map(normalizeItem);
  const subtotal = response.summary?.subtotal ?? 0;

  return {
    msg: response.message || "Cart updated successfully.",
    message: response.message,
    cart_id: 0,
    cart_items: cartItems,
    subtotal,
    discount_amount: 0,
    shipping_fee: 0,
    final_total: subtotal,
    applied_coupon: null,
    guest_token: response.guest_token ?? null,
    checkout_mode: response.checkout_mode ?? null,
    user: response.user,
    cached: false,
  };
};

const addSingleCartItem = async (item: CartAddItem): Promise<CartAddResponse> => {
  const isWholesaler = getApiAudience() === "wholesaler";
  const response = await apiRequest<CartApiResponse>(
    isWholesaler ? "/api/wholesaler/cart/add" : "/api/cart/add",
    {
      method: "POST",
      body: {
        product_id: item.product_id,
        variant_id: item.variation_id,
        quantity: item.quantity,
        ...(isWholesaler ? {} : { email: item.email }),
      },
    },
  );

  const normalized = normalizeCartResponse(response);

  return {
    ...normalized,
    guest_token: response.guest_token ?? null,
    temp_user_token: response.guest_token ?? undefined,
  };
};

export const getCart = async () =>
  normalizeCartResponse(
    await apiRequest<CartApiResponse>(
      getApiAudience() === "wholesaler"
        ? "/api/wholesaler/cart/get"
        : "/api/cart/get",
      {
      method: "GET",
      },
    ),
  );

export const addToCart = async (payload: CartAddPayload) => {
  let latestResponse: CartAddResponse | null = null;

  for (const item of payload.items) {
    latestResponse = await addSingleCartItem({
      ...item,
      email: item.email ?? payload.email,
    });
  }

  return (
    latestResponse || {
      msg: "No cart items were submitted.",
      message: "No cart items were submitted.",
      cart_id: 0,
      cart_items: [],
      subtotal: 0,
      discount_amount: 0,
      shipping_fee: 0,
      final_total: 0,
      applied_coupon: payload.coupon_code || null,
      guest_token: null,
      temp_user_token: undefined,
    }
  );
};

const normalizeCheckoutPayload = (payload?: CheckoutPayload) => {
  if (!payload) {
    return {};
  }

  const shippingAddress = payload.shipping_address || {
    address1: payload.street_address,
    city: payload.city,
    state: payload.state,
    postal_code: payload.postal_code,
    country: payload.country,
  };

  return {
    email: payload.email,
    items: payload.items,
    payment_method: payload.payment_method,
    payment_session_id: payload.payment_session_id,
    notes: payload.notes,
    coupon_code: payload.coupon_code,
    shipping_address: shippingAddress,
  };
};

export const checkoutCart = (payload?: CheckoutPayload) =>
  apiRequest<CheckoutResponse>(
    getApiAudience() === "wholesaler"
      ? "/api/wholesaler/purchase/checkout"
      : "/api/purchase/checkout",
    {
    method: "POST",
    body: normalizeCheckoutPayload(payload),
    },
  );
