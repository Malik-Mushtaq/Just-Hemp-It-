import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ApiError } from "@/lib/api/client";
import { addToCart, getCart } from "@/lib/api/cart";
import { getGuestToken, setGuestToken } from "@/lib/guestSession";

export interface CartItem {
  cart_item_id?: number;
  product_id: string | number;
  variation_id: string | number;
  product_name: string;
  variation_name: string | null;
  quantity: number;
  price: number;
  original_price: number;
  subtotal: number;
  available_stock: number | null;
  status: boolean;
  image?: string | null;
}

interface CartContextType {
  items: CartItem[];
  addItems: (
    items: Array<{
      productId: string | number;
      variationId: string | number;
      quantity: number;
    }>,
  ) => void;
  addItem: (
    productId: string | number,
    variationId: string | number,
    quantity?: number,
  ) => void;
  removeItem: (productId: string | number, variationId: string | number) => void;
  updateQuantity: (
    productId: string | number,
    variationId: string | number,
    delta: number,
  ) => void;
  totalItems: number;
  subtotal: number;
  shippingFee: number;
  finalTotal: number;
  isLoading: boolean;
  isUpdating: boolean;
  errorMessage: string | null;
  refetchCart: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | null>(null);

type CartAddSelection = {
  productId: string | number;
  variationId: string | number;
  quantity: number;
};

const parseAmount = (value: unknown) => parseFloat(String(value ?? 0)) || 0;
const parseOptionalAmount = (value: unknown) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
};

const toEntityId = (value: unknown) => {
  if (typeof value === "string") {
    const normalized = value.trim();
    return normalized.length ? normalized : null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  return null;
};

const toNonNegativeInteger = (value: unknown) => {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return null;
  }

  const integerValue = Math.trunc(numericValue);
  return integerValue >= 0 ? integerValue : null;
};

const toPositiveInteger = (value: unknown) => {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return null;
  }

  const integerValue = Math.trunc(numericValue);
  return integerValue > 0 ? integerValue : null;
};

const containsTokenMessaging = (message: string) =>
  /(token|temp[_\s-]*user|guest[_\s-]*user|bearer)/i.test(message);

const isNotNull = <T,>(value: T | null): value is T => value !== null;

const isSameLineItem = (
  item: Pick<CartItem, "product_id" | "variation_id">,
  productId: string | number,
  variationId: string | number,
) => item.product_id === productId && item.variation_id === variationId;

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [guestToken, setGuestTokenState] = useState<string | null>(() =>
    getGuestToken(),
  );
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const cartQuery = useQuery({
    queryKey: ["cart"],
    queryFn: getCart,
    enabled: isAuthenticated || Boolean(guestToken),
    retry: 1,
  });

  useEffect(() => {
    if (!isAuthenticated && !guestToken) {
      queryClient.removeQueries({ queryKey: ["cart"] });
      setIsOpen(false);
    }
  }, [guestToken, isAuthenticated, queryClient]);

  const items: CartItem[] = useMemo(
    () =>
      (cartQuery.data?.cart_items || [])
        .map((item) => {
          const productId = toEntityId(item.product_id);
          const variationId = toEntityId(item.variation_id);
          const quantity = toNonNegativeInteger(item.quantity);

          if (!productId || !variationId || quantity === null) {
            return null;
          }

          return {
            cart_item_id: item.cart_item_id,
            product_id: productId,
            variation_id: variationId,
            product_name: item.product_name,
            variation_name: item.variation_name || null,
            quantity,
            price: parseAmount(item.price),
            original_price: parseAmount(item.original_price),
            subtotal: parseAmount(item.subtotal),
            available_stock: parseOptionalAmount(item.available_stock),
            status: item.status !== false,
            image: item.image || null,
          };
        })
        .filter(isNotNull),
    [cartQuery.data?.cart_items],
  );

  const addToCartMutation = useMutation({
    mutationFn: addToCart,
    onSuccess: (response) => {
      if (typeof response.temp_user_token === "string") {
        setGuestToken(response.temp_user_token);
        setGuestTokenState(response.temp_user_token);
      }

      queryClient.setQueryData(["cart"], (previous: unknown) => ({
        ...(previous as Record<string, unknown>),
        ...response,
      }));

      void queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (error) => {
      toast({
        title: "Cart update failed",
        description:
          error instanceof ApiError
            ? error.message
            : "Unable to update cart right now.",
        variant: "destructive",
      });
    },
  });

  const mutateCartItems = (
    nextItems: Array<{
      product_id: string | number;
      variation_id: string | number;
      quantity: number;
    }>,
  ) => {
    const normalizedItems = nextItems
      .map((item) => {
          const productId = toEntityId(item.product_id);
          const variationId = toEntityId(item.variation_id);
          const quantity = toNonNegativeInteger(item.quantity);

        if (!productId || !variationId || quantity === null) {
          return null;
        }

        return {
          product_id: productId,
          variation_id: variationId,
          quantity,
        };
      })
      .filter(
        (
          item,
        ): item is {
          product_id: string | number;
          variation_id: string | number;
          quantity: number;
        } => item !== null,
      );

    if (!normalizedItems.length) {
      toast({
        title: "Cart update failed",
        description: "No valid product variation found to update the cart.",
        variant: "destructive",
      });
      return;
    }

    addToCartMutation.mutate(
      {
        items: normalizedItems,
        coupon_code: cartQuery.data?.applied_coupon || undefined,
      },
      {
        onSuccess: (response) => {
          const couponFeedback =
            typeof response.coupon_msg === "string" &&
            response.coupon_msg.trim().length
              ? response.coupon_msg.trim()
              : null;
          const backendMessage =
            typeof response.message === "string" &&
            response.message.trim().length
              ? response.message.trim()
              : null;
          const safeBackendMessage =
            backendMessage && !containsTokenMessaging(backendMessage)
              ? backendMessage
              : null;

          toast({
            title: couponFeedback ? "Coupon update" : "Success",
            description:
              couponFeedback ||
              safeBackendMessage ||
              response.msg ||
              "Cart updated successfully.",
            variant: couponFeedback ? "destructive" : "default",
          });
        },
      },
    );
  };

  const addItems = (nextSelections: CartAddSelection[]) => {
    if (!Array.isArray(nextSelections) || !nextSelections.length) {
      toast({
        title: "Select quantity",
        description:
          "Use the variation quantity controls to choose at least one item.",
        variant: "destructive",
      });
      return;
    }

    const normalizedSelections = nextSelections
      .map((selection) => {
        const productId = toEntityId(selection.productId);
        const variationId = toEntityId(selection.variationId);
        const quantity = toPositiveInteger(selection.quantity);

        if (!productId || !variationId || !quantity) {
          return null;
        }

        return {
          product_id: productId,
          variation_id: variationId,
          quantity,
        };
      })
      .filter(
        (
          selection,
        ): selection is {
          product_id: string | number;
          variation_id: string | number;
          quantity: number;
        } => selection !== null,
      );

    if (!normalizedSelections.length) {
      toast({
        title: "Select quantity",
        description: "Please select at least one valid variation quantity.",
        variant: "destructive",
      });
      return;
    }

    const nextItemsMap = new Map<
      string,
      {
        product_id: string | number;
        variation_id: string | number;
        quantity: number;
      }
    >();

    items.forEach((item) => {
      nextItemsMap.set(`${item.product_id}-${item.variation_id}`, {
        product_id: item.product_id,
        variation_id: item.variation_id,
        quantity: item.quantity,
      });
    });

    for (const selection of normalizedSelections) {
      const lineKey = `${selection.product_id}-${selection.variation_id}`;
      const currentQuantity = nextItemsMap.get(lineKey)?.quantity ?? 0;
      const nextQuantity = currentQuantity + selection.quantity;

      if (nextQuantity > 999) {
        toast({
          title: "Invalid quantity",
          description: "Maximum quantity is 999.",
          variant: "destructive",
        });
        return;
      }

      const existingLine = items.find((item) =>
        isSameLineItem(item, selection.product_id, selection.variation_id),
      );

      if (
        existingLine &&
        existingLine.available_stock !== null &&
        existingLine.available_stock > 0 &&
        nextQuantity > existingLine.available_stock
      ) {
        toast({
          title: "Out of stock",
          description: `Only ${existingLine.available_stock} unit(s) available for ${existingLine.variation_name || "this variation"}.`,
          variant: "destructive",
        });
        return;
      }

      nextItemsMap.set(lineKey, {
        product_id: selection.product_id,
        variation_id: selection.variation_id,
        quantity: nextQuantity,
      });
    }

    mutateCartItems(Array.from(nextItemsMap.values()));
    setIsOpen(true);
  };

  const addItem = (
    productId: string | number,
    variationId: string | number,
    quantity = 1,
  ) => {
    addItems([{ productId, variationId, quantity }]);
  };

  const updateQuantity = (
    productId: string | number,
    variationId: string | number,
    delta: number,
  ) => {
    if (!Number.isInteger(delta) || delta === 0) {
      return;
    }

    const existing = items.find((item) =>
      isSameLineItem(item, productId, variationId),
    );

    if (!existing) {
      return;
    }

    const nextQuantity = existing.quantity + delta;

    if (nextQuantity > 999) {
      toast({
        title: "Invalid quantity",
        description: "Maximum quantity is 999.",
        variant: "destructive",
      });
      return;
    }

    if (nextQuantity < 1) {
      removeItem(productId, variationId);
      return;
    }

    const nextItems = items.map((item) => ({
      product_id: item.product_id,
      variation_id: item.variation_id,
      quantity: isSameLineItem(item, productId, variationId)
        ? nextQuantity
        : item.quantity,
    }));

    mutateCartItems(nextItems);
  };

  const removeItem = (
    productId: string | number,
    variationId: string | number,
  ) => {
    const existing = items.find((item) =>
      isSameLineItem(item, productId, variationId),
    );

    if (!existing) {
      return;
    }

    // Send quantity 0 for deleted line-item; backend skips 0-qty rows.
    const nextItems = items.map((item) => ({
      product_id: item.product_id,
      variation_id: item.variation_id,
      quantity: isSameLineItem(item, productId, variationId)
        ? 0
        : item.quantity,
    }));

    mutateCartItems(nextItems);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = parseAmount(cartQuery.data?.subtotal);
  const shippingFee = parseAmount(cartQuery.data?.shipping_fee);
  const finalTotal = parseAmount(cartQuery.data?.final_total);

  const value = useMemo<CartContextType>(
    () => ({
      items,
      addItems,
      addItem,
      removeItem,
      updateQuantity,
      totalItems,
      subtotal,
      shippingFee,
      finalTotal,
      isLoading: cartQuery.isLoading,
      isUpdating: addToCartMutation.isPending,
      errorMessage:
        cartQuery.error instanceof ApiError ? cartQuery.error.message : null,
      refetchCart: () => {
        void cartQuery.refetch();
      },
      isOpen,
      setIsOpen,
    }),
    [
      addItem,
      addItems,
      addToCartMutation.isPending,
      cartQuery.error,
      cartQuery.isLoading,
      finalTotal,
      isOpen,
      items,
      removeItem,
      shippingFee,
      subtotal,
      totalItems,
      updateQuantity,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
