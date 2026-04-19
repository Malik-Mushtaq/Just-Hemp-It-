import React, { useEffect, useRef, useState } from "react";
import {
  CreditCard,
  Lock,
  Loader2,
  ChevronDown,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  derivePaymentDecision,
  getPaymentApiBaseUrl,
  InitPaymentSessionResponse,
  PaymentDecision,
  PaymentSessionMeta,
  persistPaymentSession,
  clearPaymentSession,
} from "@/lib/api/paymentFlow";

// ─── Trust Payments element IDs ───
const ST_SCRIPT_ID = "hempit-st-sdk";
const ST_FORM_ID = "st-form";
const ST_NOTIFICATION_ID = "st-notification-frame";
const ST_CARD_NUMBER_ID = "st-card-number";
const ST_EXPIRATION_DATE_ID = "st-expiration-date";
const ST_SECURITY_CODE_ID = "st-security-code";
const CARD_FORM_RENDER_TIMEOUT_MS = 8000;

const CARD_PROCESS_PATH = "/api/v1/payments/card/process";
const CARD_VERIFY_PATH = "/api/v1/payments/response/verify";

// ─── Helpers ───────────────────────────────────────────────

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (typeof value !== "object" || value === null) return null;
  return value as Record<string, unknown>;
};

const toText = (value: unknown): string | null => {
  if (typeof value === "string" && value.trim().length > 0) return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
};

const extractCallbackJwt = (payload: unknown): string | null => {
  const root = asRecord(payload);
  const candidates: unknown[] = [
    root?.jwt,
    root?.responseJwt,
    root?.responsejwt,
    root?.transactionjwt,
    root?.response,
    asRecord(root?.response)?.jwt,
    asRecord(root?.response)?.responsejwt,
    asRecord(root?.data)?.jwt,
  ];
  for (const candidate of candidates) {
    const text = toText(candidate);
    if (text) return text;
  }
  return null;
};

const getFormValidity = (payload: unknown): boolean => {
  const root = asRecord(payload);
  if (!root) return false;
  if (typeof root.isFormValid === "boolean") return root.isFormValid;
  const data = asRecord(root.data);
  if (typeof data?.isFormValid === "boolean") return data.isFormValid;
  const detail = asRecord(root.detail);
  if (typeof detail?.isFormValid === "boolean") return detail.isFormValid;
  return false;
};

const loadSdkScript = (): Promise<void> => {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.SecureTrading) return Promise.resolve();

  return new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(
      ST_SCRIPT_ID,
    ) as HTMLScriptElement | null;
    if (existing) {
      if (window.SecureTrading || existing.dataset.loaded === "true") {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Failed to load payment SDK")),
        { once: true },
      );
      return;
    }
    const script = document.createElement("script");
    script.id = ST_SCRIPT_ID;
    script.src = "https://cdn.eu.trustpayments.com/js/latest/st.js";
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => reject(new Error("Failed to load payment SDK"));
    document.body.appendChild(script);
  });
};

// ─── Component ─────────────────────────────────────────────

export interface CardPaymentProps {
  /** Formatted decimal string e.g. "49.99" */
  amount: string;
  currency?: string;
  /** JWT auth token for the current user */
  token: string;
  /** Shipping information to submit with checkout */
  shippingData?: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    street_address: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  onSuccess: (decision: PaymentDecision) => void;
  onError?: (error: Error) => void;
  className?: string;
}

const CardPayment: React.FC<CardPaymentProps> = ({
  amount,
  currency = "GBP",
  token,
  shippingData,
  onSuccess,
  onError,
  className,
}) => {
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [hasValiditySignal, setHasValiditySignal] = useState(false);
  const [isFormRendered, setIsFormRendered] = useState(false);
  const [sessionMeta, setSessionMeta] = useState<PaymentSessionMeta | null>(
    null,
  );
  const [initError, setInitError] = useState<string | null>(null);

  const formRef = useRef<HTMLFormElement | null>(null);
  const notificationRef = useRef<HTMLDivElement | null>(null);
  const stInstanceRef = useRef<SecureTradingInstance | null>(null);
  const hasInitializedRef = useRef(false);
  const isSubmitInFlightRef = useRef(false);
  const sessionMetaRef = useRef<PaymentSessionMeta | null>(null);

  // ── Verify card payment with backend ──────────────────────
  const verifyCardPayment = async (
    callbackPayload: unknown,
  ): Promise<PaymentDecision> => {
    const meta = sessionMetaRef.current;
    if (!meta) throw new Error("Payment session is not initialized");

    const callbackJwt = extractCallbackJwt(callbackPayload);
    if (!callbackJwt) throw new Error("Payment callback missing JWT");

    const baseUrl = getPaymentApiBaseUrl();
    const verifyBody: any = {
      jwt: callbackJwt,
      paymentSessionId: meta.paymentSessionId,
      requestReference: meta.requestReference,
    };

    // Add shipping data if available
    if (shippingData) {
      verifyBody.shippingData = {
        email: shippingData.email,
        first_name: shippingData.first_name,
        last_name: shippingData.last_name,
        phone: shippingData.phone,
        street_address: shippingData.street_address,
        city: shippingData.city,
        state: shippingData.state,
        postal_code: shippingData.postal_code,
        country: shippingData.country,
      };
    }

    const response = await fetch(`${baseUrl}${CARD_VERIFY_PATH}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(verifyBody),
    });

    let data: unknown = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!data && response.ok) {
      data = { success: true, verified: true, message: "Payment successful." };
    }

    const decision = derivePaymentDecision(data);

    if (!decision.isSuccess) {
      throw new Error(
        decision.message || `Payment failed (${response.status})`,
      );
    }

    return decision;
  };

  // ── SDK submit callback ────────────────────────────────────
  const handleSubmitCallback = async (
    callbackPayload: unknown,
  ): Promise<void> => {
    if (isSubmitInFlightRef.current) return;
    isSubmitInFlightRef.current = true;
    setIsProcessing(true);

    try {
      const decision = await verifyCardPayment(callbackPayload);
      clearPaymentSession();
      onSuccess(decision);
    } catch (error: unknown) {
      const err =
        error instanceof Error ? error : new Error("Payment processing failed");
      toast({
        title: "Payment Failed",
        description: err.message,
        variant: "destructive",
      });
      onError?.(err);
    } finally {
      setIsProcessing(false);
      isSubmitInFlightRef.current = false;
    }
  };

  // ── Initialize payment session + SDK ─────────────────────
  const initializePayment = async (): Promise<void> => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;
    setInitError(null);
    setIsInitializing(true);
    setIsFormRendered(false);
    setIsFormValid(false);
    setHasValiditySignal(false);

    try {
      const numericAmount = Number.parseFloat(amount);
      if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
        throw new Error("Invalid payment amount");
      }

      // Next frame so form DOM is mounted
      await new Promise<void>((r) => requestAnimationFrame(() => r()));

      if (!formRef.current || !notificationRef.current) {
        throw new Error("Payment form elements are not ready");
      }

      const baseUrl = getPaymentApiBaseUrl();
      const initRes = await fetch(`${baseUrl}/api/v1/payments/jwt/init`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount,
          currency,
          authToken: token,
          paymentMethod: "CARD",
        }),
      });

      let initData: InitPaymentSessionResponse | null = null;
      try {
        initData = (await initRes.json()) as InitPaymentSessionResponse;
      } catch {
        initData = null;
      }

      if (!initRes.ok) {
        throw new Error(
          initData?.message ||
            `Payment initialization failed (${initRes.status})`,
        );
      }

      if (!initData?.jwt || !initData?.paymentSessionId) {
        throw new Error("Payment session response is missing required fields");
      }

      const meta: PaymentSessionMeta = {
        paymentMethod: "CARD",
        paymentSessionId: initData.paymentSessionId,
        requestReference: initData.paymentSessionId,
        jwt: initData.jwt,
        processPath: initData.processPath,
      };

      setSessionMeta(meta);
      sessionMetaRef.current = meta;
      persistPaymentSession(meta);

      // Clean up any stale SDK placeholder nodes
      [ST_FORM_ID, ST_NOTIFICATION_ID].forEach((id) => {
        document.querySelectorAll(`#${id}`).forEach((node) => {
          if (node !== formRef.current && node !== notificationRef.current) {
            node.remove();
          }
        });
      });

      await loadSdkScript();

      if (!window.SecureTrading) {
        throw new Error("SecureTrading SDK unavailable after loading");
      }

      stInstanceRef.current?.destroy?.();

      const processPath = meta.processPath || CARD_PROCESS_PATH;
      const formAction = `${baseUrl}${processPath}`;

      // Update form action dynamically
      if (formRef.current) {
        formRef.current.action = formAction;
      }

      const st = window.SecureTrading({
        jwt: meta.jwt,
        errorReporting: true,
        submitOnSuccess: false,
        submitOnError: false,
        submitOnCancel: false,
        disabledAutoPaymentStart: ["APPLEPAY", "GOOGLEPAY"],
        submitCallback: (payload: unknown) => {
          void handleSubmitCallback(payload);
        },
        components: {
          callbacks: {
            onPaymentFormRendered: () => {
              setIsFormRendered(true);
            },
            onPaymentFormValidityChange: (payload: unknown) => {
              setHasValiditySignal(true);
              setIsFormValid(getFormValidity(payload));
            },
          },
        },
        errorCallback: (errorPayload: unknown) => {
          const msg =
            toText(asRecord(errorPayload)?.message) ||
            "Card validation failed.";
          toast({
            title: "Card Error",
            description: msg,
            variant: "destructive",
          });
        },
      });

      stInstanceRef.current = st;

      st.on("paymentFormValidityChange", (payload) => {
        setHasValiditySignal(true);
        setIsFormValid(getFormValidity(payload));
      });

      st.on("paymentFormRendered", () => {
        setIsFormRendered(true);
      });

      st.Components();
    } catch (error: unknown) {
      hasInitializedRef.current = false;
      setSessionMeta(null);
      sessionMetaRef.current = null;
      setIsFormRendered(false);

      const errMsg =
        error instanceof Error
          ? error.message
          : "Card payment could not be loaded";
      setInitError(errMsg);
      toast({
        title: "Payment Unavailable",
        description: errMsg,
        variant: "destructive",
      });
    } finally {
      setIsInitializing(false);
    }
  };

  // ── Trigger init when panel opens ───────────────────────
  useEffect(() => {
    if (!isOpen || hasInitializedRef.current) return;
    void initializePayment();
  }, [isOpen]);

  useEffect(() => {
    if (
      !isOpen ||
      !sessionMeta ||
      initError ||
      isInitializing ||
      isFormRendered
    ) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const cardNumberHost = document.getElementById(ST_CARD_NUMBER_ID);
      const hasInjectedFrame = Boolean(cardNumberHost?.querySelector("iframe"));

      if (!hasInjectedFrame) {
        const message =
          "Secure card fields did not load. Please try again. If this continues, verify Trust Payments script and backend CORS settings.";
        setInitError(message);
        hasInitializedRef.current = false;
        toast({
          title: "Payment Unavailable",
          description: message,
          variant: "destructive",
        });
      }
    }, CARD_FORM_RENDER_TIMEOUT_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [initError, isFormRendered, isInitializing, isOpen, sessionMeta, toast]);

  // ── Reset when amount/currency/token changes ─────────────
  useEffect(() => {
    setIsOpen(false);
    setIsFormValid(false);
    setHasValiditySignal(false);
    setIsFormRendered(false);
    setSessionMeta(null);
    setInitError(null);
    sessionMetaRef.current = null;
    hasInitializedRef.current = false;
    isSubmitInFlightRef.current = false;
    stInstanceRef.current?.destroy?.();
    stInstanceRef.current = null;
  }, [amount, currency, token]);

  // ── Cleanup on unmount ────────────────────────────────────
  useEffect(() => {
    return () => {
      stInstanceRef.current?.destroy?.();
      stInstanceRef.current = null;
    };
  }, []);

  const formAction = `${getPaymentApiBaseUrl()}${sessionMeta?.processPath ?? CARD_PROCESS_PATH}`;
  const disableSubmit =
    isInitializing ||
    isProcessing ||
    !sessionMeta ||
    !hasValiditySignal ||
    !isFormValid;

  const formattedAmount = Number.isFinite(Number.parseFloat(amount))
    ? `${currency} ${Number.parseFloat(amount).toFixed(2)}`
    : null;

  return (
    <div
      className={cn(
        "bg-card border rounded-xl shadow-sm overflow-hidden",
        className,
      )}
    >
      {/* ── Header ─────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setIsOpen((p) => !p)}
        disabled={isProcessing}
        className="w-full flex items-center justify-between p-6 text-left hover:bg-muted/30 transition-colors focus-visible:outline-none"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <CreditCard className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-base leading-tight">
              Pay with Card
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Visa, Mastercard &amp; more · SSL secured
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {formattedAmount && (
            <span className="text-sm font-semibold tabular-nums">
              {formattedAmount}
            </span>
          )}
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-200",
              isOpen && "rotate-180",
            )}
          />
        </div>
      </button>

      {/* ── Expandable body ────────────────────────────────── */}
      {isOpen && (
        <div className="px-6 pb-6 border-t">
          {/* ── Init Error ──────────────────────────────────── */}
          {initError && (
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
              <AlertCircle className="h-5 w-5 shrink-0 text-destructive mt-0.5" />
              <div>
                <p className="text-sm font-medium text-destructive">
                  Unable to load card payment
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {initError}
                </p>
                <button
                  type="button"
                  className="mt-2 text-xs font-semibold text-primary underline-offset-2 hover:underline"
                  onClick={() => {
                    setInitError(null);
                    hasInitializedRef.current = false;
                    void initializePayment();
                  }}
                >
                  Try again
                </button>
              </div>
            </div>
          )}

          {/* ── Trust Payments form ─────────────────────────── */}
          {!initError && (
            <div className="relative mt-5">
              {/* Loading overlay */}
              {(isInitializing || isProcessing) && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-xl bg-background/80 backdrop-blur-sm">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <p className="text-xs font-medium text-muted-foreground">
                    {isProcessing
                      ? "Processing payment…"
                      : "Loading secure form…"}
                  </p>
                </div>
              )}

              <form
                ref={formRef}
                id={ST_FORM_ID}
                action={formAction}
                method="POST"
                className="space-y-4"
                onSubmit={(e) => e.preventDefault()}
              >
                {/* Hidden metadata */}
                <input
                  type="hidden"
                  name="paymentSessionId"
                  value={sessionMeta?.paymentSessionId ?? ""}
                />
                <input
                  type="hidden"
                  name="requestReference"
                  value={sessionMeta?.requestReference ?? ""}
                />
                <input type="hidden" name="amount" value={amount} />
                <input type="hidden" name="currency" value={currency} />

                {/* Card Number */}
                <div className="space-y-1.5">
                  <label
                    htmlFor={ST_CARD_NUMBER_ID}
                    className="block text-xs font-semibold text-foreground/70 uppercase tracking-wide"
                  >
                    Card Number
                  </label>
                  <div
                    id={ST_CARD_NUMBER_ID}
                    className="min-h-[50px] rounded-xl border border-input bg-background px-3 py-2.5 shadow-sm transition-colors focus-within:border-primary focus-within:ring-1 focus-within:ring-primary"
                  />
                </div>

                {/* Expiry + CVV */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label
                      htmlFor={ST_EXPIRATION_DATE_ID}
                      className="block text-xs font-semibold text-foreground/70 uppercase tracking-wide"
                    >
                      Expiry Date
                    </label>
                    <div
                      id={ST_EXPIRATION_DATE_ID}
                      className="min-h-[50px] rounded-xl border border-input bg-background px-3 py-2.5 shadow-sm transition-colors focus-within:border-primary focus-within:ring-1 focus-within:ring-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor={ST_SECURITY_CODE_ID}
                      className="block text-xs font-semibold text-foreground/70 uppercase tracking-wide"
                    >
                      Security Code
                    </label>
                    <div
                      id={ST_SECURITY_CODE_ID}
                      className="min-h-[50px] rounded-xl border border-input bg-background px-3 py-2.5 shadow-sm transition-colors focus-within:border-primary focus-within:ring-1 focus-within:ring-primary"
                    />
                  </div>
                </div>

                {/* Notification frame */}
                <div
                  ref={notificationRef}
                  id={ST_NOTIFICATION_ID}
                  className="min-h-[4px]"
                />

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={disableSubmit}
                  className="w-full h-12 rounded-xl text-base font-semibold"
                >
                  {isProcessing ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing…
                    </span>
                  ) : (
                    `Pay${formattedAmount ? ` ${formattedAmount}` : ""}`
                  )}
                </Button>
              </form>
            </div>
          )}

          {/* ── Trust badge ─────────────────────────────────── */}
          <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5" />
            <span>256-bit SSL · Powered by Trust Payments</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CardPayment;
