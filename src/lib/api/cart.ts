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
  compare_at_price?: number | string | null;
  original_price: number | string | null;
  discounted_price?: number | string | null;
  discount_percentage?: number;
  subtotal: number | string;
  stock?: number | null;
  available_stock?: number | null;
  status?: boolean | null;
  is_out_of_stock?: boolean;
  stock_status?: "available" | "out_of_stock";
  image?: string | null;
}

type CartSummary = {
  total_items?: number;
  subtotal?: number;
  discount_amount?: number;
  shipping_fee?: number;
  final_total?: number;
  applied_coupon?: string | null;
  coupon_code?: string | null;
  original_total?: number;
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
  compare_at_price?: number | string | null;
  discounted_price?: number | string | null;
  sale_price?: number | string | null;
  final_price?: number | string | null;
  subtotal?: number | string;
  final_subtotal?: number | string | null;
  original_subtotal?: number | string | null;
  line_total?: number | string | null;
  discount_amount?: number | string | null;
  image?: string | null;
  available_stock?: number | null;
  stock?: number | null;
  status?: boolean | null;
  is_out_of_stock?: boolean | null;
  stock_status?: "available" | "out_of_stock" | null;
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
  subtotal?: number | string;
  discount_amount?: number | string;
  shipping_fee?: number | string;
  final_total?: number | string;
  applied_coupon?: string | null;
  coupon_code?: string | null;
  coupon_msg?: string | null;
  original_total?: number | string;
  data?: {
    original_total?: number | string;
    discount_amount?: number | string;
    final_total?: number | string;
    shipping_fee?: number | string;
    coupon_code?: string | null;
  } | null;
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
  items?: CartAddItem[];
  coupon_code?: string | null;
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

const normalizeItem = (item: CartApiItem): CartItem => {
  const quantity = item.quantity ?? 0;
  const originalPrice =
    item.original_price ?? item.compare_at_price ?? item.price ?? 0;
  const effectivePrice =
    item.discounted_price ?? item.sale_price ?? item.final_price ?? item.price ?? 0;
  const availableStock = item.available_stock ?? item.stock ?? null;
  const isOutOfStock =
    typeof item.is_out_of_stock === "boolean"
      ? item.is_out_of_stock
      : item.status === false;
  const stockStatus =
    item.stock_status ?? (isOutOfStock ? "out_of_stock" : "available");
  const status =
    typeof item.status === "boolean" ? item.status : !isOutOfStock;
  const originalAmount = parseAmount(originalPrice);
  const effectiveAmount = parseAmount(effectivePrice);
  const discountPercentage =
    originalAmount > effectiveAmount
      ? Math.round(((originalAmount - effectiveAmount) / originalAmount) * 100)
      : 0;

  return {
    cart_item_id: item.cart_item_id,
    product_id: toEntityId(item.product_id),
    variation_id: toEntityId(item.variant_id ?? item.variation_id),
    product_name: item.product_name || item.title || item.name || "Product",
    variation_name: item.variation_name ?? item.variant_name ?? null,
    quantity,
    minimum_order_quantity:
      item.min_order_qty_wholesale ?? item.min_order_qty_retail ?? null,
    min_order_quantity:
      item.min_order_qty_wholesale ?? item.min_order_qty_retail ?? null,
    price: effectivePrice,
    compare_at_price: item.compare_at_price ?? null,
    original_price:
      originalAmount > effectiveAmount ? originalPrice : item.original_price ?? null,
    discounted_price:
      originalAmount > effectiveAmount
        ? item.discounted_price ?? item.sale_price ?? item.final_price ?? effectivePrice
        : null,
    discount_percentage: discountPercentage,
    subtotal:
      item.final_subtotal ??
      item.line_total ??
      item.subtotal ??
      Number(effectivePrice ?? 0) * Number(quantity ?? 0),
    stock: item.stock ?? availableStock,
    available_stock: availableStock,
    status,
    is_out_of_stock: isOutOfStock,
    stock_status: stockStatus,
    image: item.image ?? null,
  };
};

const parseAmount = (value: unknown, fallback = 0) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
};

const normalizeCartResponse = (response: CartApiResponse): CartResponse => {
  const cartItems = (response.items || []).map(normalizeItem);
  const itemSubtotal = cartItems.reduce(
    (sum, item) => sum + parseAmount(item.subtotal),
    0,
  );
  const itemOriginalSubtotal = cartItems.reduce(
    (sum, item) => sum + parseAmount(item.original_price) * parseAmount(item.quantity),
    0,
  );
  const subtotal = parseAmount(
    response.summary?.original_total ??
      response.summary?.subtotal ??
      response.original_total ??
      response.subtotal,
    itemOriginalSubtotal || itemSubtotal,
  );
  const discountAmount = parseAmount(
    response.summary?.discount_amount ??
      response.discount_amount ??
      response.data?.discount_amount,
    Math.max(0, subtotal - itemSubtotal),
  );
  const shippingFee = parseAmount(
    response.summary?.shipping_fee ??
      response.shipping_fee ??
      response.data?.shipping_fee,
    0,
  );
  const finalTotal = parseAmount(
    response.summary?.final_total ??
      response.final_total ??
      response.data?.final_total,
    Math.max(0, subtotal - discountAmount) + shippingFee,
  );
  const appliedCoupon =
    response.summary?.applied_coupon ??
    response.summary?.coupon_code ??
    response.applied_coupon ??
    response.coupon_code ??
    response.data?.coupon_code ??
    null;

  return {
    msg: response.message || "Cart updated successfully.",
    message: response.message,
    cart_id: 0,
    cart_items: cartItems,
    subtotal,
    discount_amount: discountAmount,
    shipping_fee: shippingFee,
    final_total: finalTotal,
    applied_coupon: appliedCoupon,
    guest_token: response.guest_token ?? null,
    checkout_mode: response.checkout_mode ?? null,
    user: response.user,
    cached: false,
  };
};

const addSingleCartItem = async (
  item?: CartAddItem,
  couponCode?: string | null,
  email?: string,
): Promise<CartAddResponse> => {
  const isWholesaler = getApiAudience() === "wholesaler";
  const response = await apiRequest<CartApiResponse>(
    isWholesaler ? "/api/wholesaler/cart/add" : "/api/cart/add",
    {
      method: "POST",
      body: {
        ...(item
          ? {
              product_id: item.product_id,
              variant_id: item.variation_id,
              quantity: item.quantity,
            }
          : {}),
        ...(couponCode !== undefined ? { coupon_code: couponCode } : {}),
        ...(isWholesaler ? {} : { email: email ?? item?.email }),
      },
    },
  );
  console.log(response)
  const normalized = normalizeCartResponse(response);

  return {
    ...normalized,
    coupon_msg: response.coupon_msg ?? undefined,
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
  const normalizedItems = payload.items || [];
  const hasCouponUpdate = payload.coupon_code !== undefined;
  let latestResponse: CartAddResponse | null = null;

  if (!normalizedItems.length && hasCouponUpdate) {
    return addSingleCartItem(undefined, payload.coupon_code, payload.email);
  }

  for (const item of normalizedItems) {
    latestResponse = await addSingleCartItem({
      ...item,
      email: item.email ?? payload.email,
    }, payload.coupon_code);
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
    line1: payload.street_address,
    address1: payload.street_address,
    city: payload.city,
    state: payload.state,
    postal_code: payload.postal_code,
    zip: payload.postal_code,
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
