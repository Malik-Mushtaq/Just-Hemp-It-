import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Shield, AlertCircle, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getPricingAudience } from "@/lib/authAudience";
import AnnouncementBar from "@/components/AnnouncementBar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CardPayment from "@/components/CardPayment";
import { getCart } from "@/lib/api/cart";
import { getMinimumOrderQuantity } from "@/lib/api/product";
import { PaymentDecision } from "@/lib/api/paymentFlow";
import { formatGBP, formatGBPFromUnknown } from "@/lib/currency";
import { getShippingRules } from "@/lib/api/shipping";
import { getUserProfile } from "@/lib/api/profile";
import { getGuestToken } from "@/lib/guestSession";

export interface ShippingFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  street_address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

const Checkout = () => {
  const { isAuthenticated, token, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const guestToken = getGuestToken();
  const effectiveToken = token || guestToken;
  const pricingAudience = getPricingAudience(user);

  const [shippingData, setShippingData] = useState<ShippingFormData>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    street_address: "",
    city: "",
    state: "",
    postal_code: "",
    country: "",
  });

  const cartQuery = useQuery({
    queryKey: ["cart"],
    queryFn: getCart,
    enabled: Boolean(effectiveToken),
    retry: 1,
  });

  const shippingRulesQuery = useQuery({
    queryKey: ["shipping-rules", "checkout", "live"],
    queryFn: getShippingRules,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  const profileQuery = useQuery({
    queryKey: ["user-profile", user?.id],
    queryFn: () => getUserProfile(),
    enabled: isAuthenticated && !!user?.id,
    retry: 1,
  });

  // Prefill form with user profile data
  useEffect(() => {
    if (isAuthenticated && profileQuery.data?.user) {
      const profile = profileQuery.data.user;
      setShippingData({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        street_address: profile.street1 || "",
        city: profile.city || "",
        state: "",
        postal_code: profile.postcode || "",
        country: profile.country || "",
      });
    }
  }, [profileQuery.data, isAuthenticated]);

  const handlePaymentSuccess = (decision: PaymentDecision) => {
    toast({
      title: "Order Placed!",
      description: decision.message || "Your payment was successful.",
      variant: "default",
    });
    navigate(isAuthenticated ? "/dashboard/orders" : "/products", {
      replace: true,
    });
  };

  useEffect(() => {
    if (!effectiveToken) {
      navigate("/cart", { replace: true });
    }
  }, [effectiveToken, navigate]);

  if (!effectiveToken) return null;

  if (cartQuery.isLoading) {
    return (
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
    );
  }

  if (cartQuery.isError || !cartQuery.data) {
    return (
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
                onClick={() => navigate("/cart", { replace: true })}
                className="rounded-full"
              >
                Back to Cart
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const cartData = cartQuery.data;
  const items = cartData.cart_items || [];

  const shippingRules = useMemo(
    () =>
      [...(shippingRulesQuery.data?.data || [])].sort(
        (leftRule, rightRule) =>
          Number(leftRule.min_order_amount || 0) -
          Number(rightRule.min_order_amount || 0),
      ),
    [shippingRulesQuery.data?.data],
  );

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <AnnouncementBar />
        <Navbar />
        <main className="py-12">
          <div className="container max-w-5xl">
            <div className="text-center py-20">
              <AlertCircle className="h-16 w-16 mx-auto text-destructive/30 mb-4" />
              <p className="text-muted-foreground mb-4">Your cart is empty</p>
              <Button
                onClick={() => navigate("/cart", { replace: true })}
                className="rounded-full"
              >
                Back to Cart
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const paymentAmount = Number(cartData.final_total).toFixed(2);
  const wholesaleMoqViolations =
    pricingAudience === "wholesaler"
      ? items
          .map((item) => {
            const minimumOrderQuantity = getMinimumOrderQuantity(item);
            const quantity = Number(item.quantity) || 0;

            if (minimumOrderQuantity > 1 && quantity < minimumOrderQuantity) {
              return {
                key:
                  item.cart_item_id || `${item.product_id}-${item.variation_id}`,
                name: item.product_name,
                variationName: item.variation_name || null,
                quantity,
                minimumOrderQuantity,
              };
            }

            return null;
          })
          .filter(
            (
              violation,
            ): violation is {
              key: string | number;
              name: string;
              variationName: string | null;
              quantity: number;
              minimumOrderQuantity: number;
            } => violation !== null,
          )
      : [];
  const canCheckout = wholesaleMoqViolations.length === 0;

  return (
    <div className="min-h-screen bg-background">
      <AnnouncementBar />
      <Navbar />
      <main className="py-12">
        <div className="container max-w-5xl">
          <h1 className="text-3xl font-bold mb-8">Checkout</h1>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left — Forms */}
            <div className="lg:col-span-2 space-y-8">
              {/* Shipping */}
              <div className="bg-card border rounded-xl p-6 shadow-sm">
                <h2 className="font-semibold text-lg mb-4">
                  Shipping Information
                </h2>
                <form
                  className="space-y-4"
                  onSubmit={(e) => e.preventDefault()}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      placeholder="First Name"
                      className="rounded-xl h-11"
                      value={shippingData.first_name}
                      onChange={(e) =>
                        setShippingData({
                          ...shippingData,
                          first_name: e.target.value,
                        })
                      }
                      required
                    />
                    <Input
                      placeholder="Last Name"
                      className="rounded-xl h-11"
                      value={shippingData.last_name}
                      onChange={(e) =>
                        setShippingData({
                          ...shippingData,
                          last_name: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <Input
                    placeholder="Street Address"
                    className="rounded-xl h-11"
                    value={shippingData.street_address}
                    onChange={(e) =>
                      setShippingData({
                        ...shippingData,
                        street_address: e.target.value,
                      })
                    }
                    required
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Input
                      placeholder="City"
                      className="rounded-xl h-11"
                      value={shippingData.city}
                      onChange={(e) =>
                        setShippingData({
                          ...shippingData,
                          city: e.target.value,
                        })
                      }
                      required
                    />
                    <Input
                      placeholder="State"
                      className="rounded-xl h-11"
                      value={shippingData.state}
                      onChange={(e) =>
                        setShippingData({
                          ...shippingData,
                          state: e.target.value,
                        })
                      }
                      required
                    />
                    <Input
                      placeholder="ZIP Code"
                      className="rounded-xl h-11"
                      value={shippingData.postal_code}
                      onChange={(e) =>
                        setShippingData({
                          ...shippingData,
                          postal_code: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <Input
                    placeholder="Phone Number"
                    type="tel"
                    className="rounded-xl h-11"
                    value={shippingData.phone}
                    onChange={(e) =>
                      setShippingData({
                        ...shippingData,
                        phone: e.target.value,
                      })
                    }
                    required
                  />
                  <Input
                    placeholder="Email Address"
                    type="email"
                    className="rounded-xl h-11"
                    value={shippingData.email}
                    onChange={(e) =>
                      setShippingData({
                        ...shippingData,
                        email: e.target.value,
                      })
                    }
                    required
                  />
                  {isAuthenticated && (
                    <p className="text-xs text-muted-foreground">
                      Shipping address from your profile. You can edit these
                      fields if needed.
                    </p>
                  )}
                </form>
              </div>

              {/* Shipping Method */}
              <div className="bg-card border rounded-xl p-6 shadow-sm">
                <h2 className="font-semibold text-lg mb-4">Shipping Rules</h2>

                {shippingRulesQuery.isLoading ? (
                  <p className="text-sm text-muted-foreground">
                    Loading shipping rules...
                  </p>
                ) : null}

                {shippingRulesQuery.isError ? (
                  <p className="text-sm text-destructive">
                    Unable to load shipping rules right now.
                  </p>
                ) : null}

                {!shippingRulesQuery.isLoading &&
                !shippingRulesQuery.isError &&
                !shippingRules.length ? (
                  <p className="text-sm text-muted-foreground">
                    No shipping rules available right now.
                  </p>
                ) : null}

                {shippingRules.length ? (
                  <div className="space-y-3">
                    {shippingRules.map((rule) => (
                      <div
                        key={rule.shipping_id}
                        className="flex items-start justify-between border rounded-xl p-4"
                      >
                        <div className="pr-3">
                          <p className="text-sm font-medium">
                            {rule.rule_name}
                          </p>
                          {rule.description ? (
                            <p className="text-xs text-muted-foreground mt-1">
                              {rule.description}
                            </p>
                          ) : null}
                          <p className="text-xs text-muted-foreground mt-1">
                            Applies from{" "}
                            {formatGBPFromUnknown(rule.min_order_amount)}
                          </p>
                        </div>
                        <span className="text-sm font-medium shrink-0">
                          {Number(rule.shipping_fee) === 0
                            ? "Free"
                            : formatGBPFromUnknown(rule.shipping_fee)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              {/* Card Payment */}
              {pricingAudience === "wholesaler" && !canCheckout ? (
                <div className="bg-card border rounded-xl p-6 shadow-sm">
                  <h2 className="font-semibold text-lg mb-4">
                    Minimum Order Quantity Required
                  </h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Increase the quantities below before checkout can continue.
                  </p>
                  <div className="space-y-3">
                    {wholesaleMoqViolations.map((violation) => (
                      <div
                        key={violation.key}
                        className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm"
                      >
                        <p className="font-medium text-foreground">
                          {violation.name}
                          {violation.variationName
                            ? ` (${violation.variationName})`
                            : ""}
                        </p>
                        <p className="mt-1 text-destructive">
                          Quantity {violation.quantity} is below MOQ{" "}
                          {violation.minimumOrderQuantity}.
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <CardPayment
                  amount={paymentAmount}
                  currency="GBP"
                  token={effectiveToken}
                  shippingData={shippingData}
                  onSuccess={handlePaymentSuccess}
                />
              )}
            </div>

            {/* Right — Summary */}
            <div className="lg:sticky lg:top-20 self-start">
              <div className="bg-card border rounded-xl p-6 shadow-sm space-y-4">
                <h3 className="font-semibold text-lg">Order Summary</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {items.map((item) => (
                    <div
                      key={
                        item.cart_item_id ||
                        `${item.product_id}-${item.variation_id}`
                      }
                      className="flex justify-between text-sm"
                    >
                      <span className="text-muted-foreground truncate mr-2">
                        {`${item.product_name}${
                          item.variation_name
                            ? ` (${item.variation_name})`
                            : ""
                        } x ${item.quantity}${
                          getMinimumOrderQuantity(item) > 1
                            ? ` · MOQ ${getMinimumOrderQuantity(item)}`
                            : ""
                        }`}
                      </span>
                      <span className="shrink-0">
                        {formatGBPFromUnknown(item.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatGBPFromUnknown(cartData.subtotal)}</span>
                  </div>
                  {cartData.applied_coupon ? (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Coupon</span>
                      <span className="font-medium">{cartData.applied_coupon}</span>
                    </div>
                  ) : null}
                  {Number(cartData.discount_amount) > 0 && (
                    <div className="flex justify-between text-primary">
                      <span className="text-muted-foreground">Discount</span>
                      <span>
                        -{formatGBPFromUnknown(cartData.discount_amount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>
                      {Number(cartData.shipping_fee) === 0
                        ? "Free"
                        : formatGBPFromUnknown(cartData.shipping_fee)}
                    </span>
                  </div>
                </div>
                <div className="border-t pt-3 flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{formatGBPFromUnknown(cartData.final_total)}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <span>Secure payment — your data is protected</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Checkout;
