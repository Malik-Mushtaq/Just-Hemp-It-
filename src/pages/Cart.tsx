import { Link, useNavigate } from "react-router-dom";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingCart,
  AlertCircle,
  Loader,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import AnnouncementBar from "@/components/AnnouncementBar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import { getCart, addToCart } from "@/lib/api/cart";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ApiError } from "@/lib/api/client";
import { formatGBP, formatGBPFromUnknown } from "@/lib/currency";
import { getGuestToken } from "@/lib/guestSession";

const CouponSchema = z.object({
  coupon_code: z
    .string()
    .trim()
    .min(2, "Coupon code is required")
    .max(50, "Coupon code must be less than 50 characters")
    .regex(
      /^[A-Za-z0-9_-]+$/,
      "Coupon code can only contain letters, numbers, underscore, or hyphen",
    ),
});

type CouponFormValues = z.infer<typeof CouponSchema>;

const getKnownStockLimit = (value: unknown) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue > 0
    ? numericValue
    : null;
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

const CartPage = () => {
  const { isAuthenticated, token } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const guestToken = getGuestToken();
  const hasAccessToken = Boolean(token || guestToken);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CouponFormValues>({
    resolver: zodResolver(CouponSchema),
    defaultValues: {
      coupon_code: "",
    },
  });

  const cartQuery = useQuery({
    queryKey: ["cart"],
    queryFn: getCart,
    enabled: hasAccessToken,
    retry: 1,
  });

  const addToCartMutation = useMutation({
    mutationFn: addToCart,
    onSuccess: (response) => {
      // Write the full response directly into the query cache.
      // Do NOT follow up with a refetch — the /cart/add response is already
      // the committed server state. A refetch can return stale Redis data and
      // overwrite the correct values, causing the visible "revert after 1s" bug.
      queryClient.setQueryData(["cart"], (prev: unknown) => ({
        ...(prev as Record<string, unknown>),
        ...response,
      }));

      const couponFeedback =
        typeof response.coupon_msg === "string" && response.coupon_msg.trim()
          ? response.coupon_msg.trim()
          : null;
      const backendMessage =
        typeof response.message === "string" && response.message.trim()
          ? response.message.trim()
          : null;

      const description =
        couponFeedback ||
        backendMessage ||
        response.msg ||
        "Cart updated successfully!";

      toast({
        title: couponFeedback ? "Coupon update" : "Cart updated",
        description,
        variant: couponFeedback ? "destructive" : "default",
      });
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast({
          title: "Error",
          description: error.message || "Failed to update cart",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
      }
    },
  });

  if (!hasAccessToken) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-background">
          <AnnouncementBar />
          <Navbar />
          <main className="py-12">
            <div className="container max-w-5xl">
              <div className="text-center py-20">
                <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground mb-4">Your cart is empty</p>
                <Button
                  onClick={() => navigate("/products")}
                  className="rounded-full"
                >
                  Browse Products
                </Button>
              </div>
            </div>
          </main>
          <Footer />
        </div>
      </PageTransition>
    );
  }

  if (cartQuery.isLoading) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-background">
          <AnnouncementBar />
          <Navbar />
          <main className="py-12">
            <div className="container max-w-5xl">
              <div className="text-center py-20">
                <Loader className="h-8 w-8 mx-auto text-primary animate-spin mb-4" />
                <p className="text-muted-foreground">Loading your cart...</p>
              </div>
            </div>
          </main>
          <Footer />
        </div>
      </PageTransition>
    );
  }

  if (cartQuery.isError) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-background">
          <AnnouncementBar />
          <Navbar />
          <main className="py-12">
            <div className="container max-w-5xl">
              <div className="text-center py-20">
                <AlertCircle className="h-16 w-16 mx-auto text-destructive/30 mb-4" />
                <p className="text-muted-foreground mb-4">
                  Failed to load your cart
                </p>
                <Button
                  onClick={() => cartQuery.refetch()}
                  className="rounded-full"
                >
                  Try Again
                </Button>
              </div>
            </div>
          </main>
          <Footer />
        </div>
      </PageTransition>
    );
  }

  const cartData = cartQuery.data;
  const items = cartData?.cart_items || [];
  const subtotal = parseFloat(String(cartData?.subtotal ?? 0)) || 0;
  const discountAmount =
    parseFloat(String(cartData?.discount_amount ?? 0)) || 0;
  const shippingFee = parseFloat(String(cartData?.shipping_fee ?? 0)) || 0;
  const finalTotal = parseFloat(String(cartData?.final_total ?? 0)) || 0;
  const appliedCouponCode = cartData?.applied_coupon ?? null;

  const toCartPayloadItems = (
    quantityResolver?: (item: (typeof items)[number]) => number,
  ) =>
    items
      .map((item) => {
        const productId = toEntityId(item.product_id);
        const variationId = toEntityId(item.variation_id);
        const resolvedQuantity = quantityResolver
          ? quantityResolver(item)
          : Number(item.quantity);
        const quantity = toNonNegativeInteger(resolvedQuantity);

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

  const handleUpdateQuantity = (
    productId: string | number,
    variationId: string | number,
    currentQuantity: number,
    change: number,
  ) => {
    const newQuantity = currentQuantity + change;

    if (newQuantity > 999) {
      toast({
        title: "Error",
        description: "Maximum quantity is 999",
        variant: "destructive",
      });
      return;
    }

    // Set quantity to 0 for the deleted item; backend skips 0-qty items
    const payloadItems = toCartPayloadItems((item) =>
      item.product_id === productId && item.variation_id === variationId
        ? Math.max(0, newQuantity)
        : Number(item.quantity),
    );

    if (!payloadItems.length) {
      toast({
        title: "Cart update failed",
        description: "No valid product variation found to update the cart.",
        variant: "destructive",
      });
      return;
    }

    addToCartMutation.mutate({
      items: payloadItems,
      coupon_code: appliedCouponCode || undefined,
    });
  };

  const onApplyCoupon = handleSubmit((values) => {
    if (!items.length) {
      toast({
        title: "No items in cart",
        description: "Add at least one item before applying a coupon.",
        variant: "destructive",
      });
      return;
    }

    const payloadItems = toCartPayloadItems();

    if (!payloadItems.length) {
      toast({
        title: "Cart update failed",
        description: "No valid product variation found to update the cart.",
        variant: "destructive",
      });
      return;
    }

    addToCartMutation.mutate({
      items: payloadItems,
      coupon_code: values.coupon_code.trim().toUpperCase(),
    });
  });

  const handleRemoveCoupon = () => {
    const payloadItems = toCartPayloadItems();

    if (!payloadItems.length) {
      toast({
        title: "Cart update failed",
        description: "No valid product variation found to update the cart.",
        variant: "destructive",
      });
      return;
    }
    addToCartMutation.mutate(
      { items: payloadItems, coupon_code: "" },
      { onSuccess: () => reset() },
    );
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <AnnouncementBar />
        <Navbar />
        <main className="py-12">
          <div className="container max-w-5xl">
            <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

            {items.length === 0 ? (
              <div className="text-center py-20">
                <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground mb-4">Your cart is empty</p>
                <Button asChild className="rounded-full">
                  <Link to="/products">Browse Products</Link>
                </Button>
              </div>
            ) : (
              <div className="grid lg:grid-cols-3 gap-8">
                {/* Items */}
                <div className="lg:col-span-2 space-y-4">
                  {items.map((item) => (
                    <div
                      key={
                        item.cart_item_id ||
                        `${item.product_id}-${item.variation_id}`
                      }
                      className="bg-card border rounded-xl p-4 flex gap-4 items-center"
                    >
                      <div className="h-20 w-20 bg-gradient-to-br from-primary/15 to-accent/15 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.product_name}
                            className="h-full w-full "
                          />
                        ) : (
                          <span className="text-2xl">🌿</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-sm truncate">
                              {item.product_name}
                            </h3>
                            {item.variation_name ? (
                              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                {item.variation_name}
                              </p>
                            ) : null}
                            <p className="text-primary font-bold mt-1">
                              {formatGBPFromUnknown(item.price)}
                            </p>
                            {parseFloat(String(item.original_price)) >
                              parseFloat(String(item.price)) && (
                              <p className="text-xs text-muted-foreground line-through">
                                {formatGBPFromUnknown(item.original_price)}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            className="h-7 w-7 rounded-full border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-50"
                            onClick={() =>
                              handleUpdateQuantity(
                                item.product_id,
                                item.variation_id,
                                item.quantity,
                                -1,
                              )
                            }
                            disabled={
                              addToCartMutation.isPending || item.quantity <= 1
                            }
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-sm font-medium w-6 text-center">
                            {item.quantity}
                          </span>
                          <button
                            className="h-7 w-7 rounded-full border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-50"
                            onClick={() =>
                              handleUpdateQuantity(
                                item.product_id,
                                item.variation_id,
                                item.quantity,
                                1,
                              )
                            }
                            disabled={
                              addToCartMutation.isPending ||
                              (() => {
                                const stockLimit = getKnownStockLimit(
                                  item.available_stock,
                                );
                                return (
                                  stockLimit !== null &&
                                  item.quantity >= stockLimit
                                );
                              })()
                            }
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <p className="font-bold text-sm">
                          {formatGBPFromUnknown(item.subtotal)}
                        </p>
                        <button
                          onClick={() =>
                            handleUpdateQuantity(
                              item.product_id,
                              item.variation_id,
                              item.quantity,
                              -item.quantity,
                            )
                          }
                          disabled={addToCartMutation.isPending}
                          className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Summary */}
                <div className="lg:sticky lg:top-20 self-start">
                  <div className="bg-card border rounded-xl p-6 shadow-sm space-y-4">
                    <h3 className="font-semibold text-lg">Order Summary</h3>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Coupon Code</label>
                      <div className="flex gap-2">
                        {appliedCouponCode ? (
                          <>
                            <input
                              type="text"
                              value={appliedCouponCode}
                              readOnly
                              className="flex h-10 w-full rounded-md border border-primary/40 bg-primary/5 px-3 py-2 text-sm font-mono font-semibold text-primary"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={handleRemoveCoupon}
                              disabled={addToCartMutation.isPending}
                            >
                              {addToCartMutation.isPending ? "..." : "Remove"}
                            </Button>
                          </>
                        ) : (
                          <form
                            onSubmit={onApplyCoupon}
                            className="flex gap-2 w-full"
                          >
                            <input
                              type="text"
                              placeholder="Enter coupon"
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                              {...register("coupon_code")}
                              disabled={addToCartMutation.isPending}
                            />
                            <Button
                              type="submit"
                              variant="outline"
                              size="sm"
                              disabled={
                                addToCartMutation.isPending || !items.length
                              }
                            >
                              {addToCartMutation.isPending
                                ? "Applying..."
                                : "Apply"}
                            </Button>
                          </form>
                        )}
                      </div>
                      {!appliedCouponCode && errors.coupon_code ? (
                        <p className="text-xs text-destructive">
                          {errors.coupon_code.message}
                        </p>
                      ) : null}
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{formatGBP(subtotal)}</span>
                      </div>
                      {discountAmount > 0 ? (
                        <div className="flex justify-between text-primary">
                          <span className="text-muted-foreground">
                            Discount
                          </span>
                          <span>-{formatGBP(discountAmount)}</span>
                        </div>
                      ) : null}

                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Shipping</span>
                        <span>
                          {shippingFee === 0 ? "Free" : formatGBP(shippingFee)}
                        </span>
                      </div>
                    </div>
                    <div className="border-t pt-3 flex justify-between font-bold">
                      <span>Total</span>
                      <span>{formatGBP(finalTotal)}</span>
                    </div>
                    <Button
                      asChild
                      className="w-full rounded-xl h-11"
                      disabled={items.length === 0}
                    >
                      <Link to="/checkout">Checkout</Link>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </PageTransition>
  );
};

export default CartPage;
