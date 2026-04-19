import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import AuthSplitLayout from "@/components/auth/AuthSplitLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import { isDemoUser } from "@/lib/authAudience";
import { loginUser, LoginResponse, verifyGoogleToken } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";

type GoogleCredentialResponse = {
  credential?: string;
};

type GoogleIdConfiguration = {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
  ux_mode?: "popup" | "redirect";
};

type GoogleIdButtonOptions = {
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "large" | "medium" | "small";
  text?: "continue_with" | "signin_with" | "signup_with";
  shape?: "pill" | "rectangular" | "circle" | "square";
  width?: number;
  logo_alignment?: "left" | "center";
};

type GoogleAccountsId = {
  initialize: (config: GoogleIdConfiguration) => void;
  renderButton: (parent: HTMLElement, options: GoogleIdButtonOptions) => void;
};

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: GoogleAccountsId;
      };
    };
  }
}

const noHtmlPattern = /^(?!.*<[^>]+>).*$/;
const GOOGLE_GSI_SCRIPT_ID = "google-gsi-script";
const GOOGLE_GSI_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .max(100, "Email must not exceed 100 characters")
    .email("Please enter a valid email address")
    .regex(noHtmlPattern, "HTML tags are not allowed"),
  password: z
    .string()
    .trim()
    .min(6, "Password must be between 6 and 30 characters")
    .max(30, "Password must be between 6 and 30 characters")
    .regex(noHtmlPattern, "HTML tags are not allowed"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type LoginVariant = "retailer" | "wholesale";

const apiFieldToFormField: Record<string, keyof LoginFormValues> = {
  email: "email",
  password: "password",
};

const getInputClassName = (hasError: boolean, withTrailingIcon = false) =>
  cn(
    "h-11 min-w-0 rounded-2xl border-[#d7c6a9] bg-[#fcfaf4] text-[#4a3928] placeholder:text-[#8f7b65] focus-visible:ring-[#6d8440]",
    withTrailingIcon ? "pl-11 pr-11" : "pl-11",
    hasError && "border-destructive focus-visible:ring-destructive",
  );

const loginContent: Record<
  LoginVariant,
  {
    heroEyebrow: string;
    heroTitle: string;
    heroDescription: string;
    formEyebrow: string;
    heading: string;
    subheading: string;
    emailPlaceholder: string;
    features: { title: string; description: string }[];
    signupPath: string;
    signupLabel: string;
  }
> = {
  retailer: {
    heroEyebrow: "Retail Partner Portal",
    heroTitle: "Welcome back to the JUST HEMP IT retail desk.",
    heroDescription:
      "Sign in to review orders, keep your product mix fresh, and stay aligned with the latest brand releases.",
    formEyebrow: "Retailer Login",
    heading: "Sign In",
    subheading:
      "Access your retail account and manage your JUST HEMP IT activity.",
    emailPlaceholder: "you@retailshop.com",
    features: [
      {
        title: "Retail-first support",
        description:
          "Order tracking, account updates, and quick access to your essentials.",
      },
      {
        title: "Logo-led visual system",
        description:
          "Olive, gold, and earthy neutrals carried across every customer touchpoint.",
      },
    ],
    signupPath: "/retailer-signup",
    signupLabel: "Retailer Signup",
  },
  wholesale: {
    heroEyebrow: "Wholesale Access",
    heroTitle: "Built for buyers, retailers, and hemp-focused partners.",
    heroDescription:
      "Access wholesale pricing, monitor account activity, and manage your JUST HEMP IT relationship from one polished dashboard.",
    formEyebrow: "Wholesale Login",
    heading: "Wholesale Portal",
    subheading:
      "Sign in to access pricing, account tools, and wholesale support.",
    emailPlaceholder: "wholesale@business.com",
    features: [
      {
        title: "Priority fulfillment",
        description:
          "Wholesale-ready ordering with faster decision points and clearer account visibility.",
      },
      {
        title: "Stronger shelf presence",
        description:
          "A cleaner, premium-looking customer experience rooted in the logo's visual identity.",
      },
    ],
    signupPath: "/wholesale-signup",
    signupLabel: "Wholesale Signup",
  },
};

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, setSession, user } = useAuth();
  const googleButtonContainerRef = useRef<HTMLDivElement | null>(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as
    | string
    | undefined;

  const variant: LoginVariant = location.pathname.includes("wholesale")
    ? "wholesale"
    : "retailer";
  const content = loginContent[variant];

  const [showPass, setShowPass] = useState(false);
  const [isGoogleReady, setIsGoogleReady] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleErrorMessage, setGoogleErrorMessage] = useState<string | null>(
    null,
  );

  const {
    register,
    handleSubmit,
    clearErrors,
    setError,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const redirectPath = useMemo(() => {
    const state = location.state as { from?: string } | undefined;

    if (typeof state?.from === "string" && state.from.startsWith("/")) {
      return state.from;
    }

    return "/dashboard";
  }, [location.state]);

  const loginMutation = useMutation({
    mutationFn: loginUser,
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate(isDemoUser(user) ? "/" : redirectPath, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectPath, user]);

  const completeLogin = useCallback(
    (response: LoginResponse) => {
      setSession({
        token: response.token,
        user: response.user,
      });

      toast({
        title: "Welcome back",
        description: response.message,
      });

      navigate(isDemoUser(response.user) ? "/" : redirectPath, {
        replace: true,
      });
    },
    [navigate, redirectPath, setSession],
  );

  const handleGoogleCredential = useCallback(
    async (credential?: string) => {
      if (!credential) {
        toast({
          title: "Google login failed",
          description: "No Google credential was returned.",
          variant: "destructive",
        });
        return;
      }

      setGoogleErrorMessage(null);
      setIsGoogleLoading(true);

      try {
        const response = await verifyGoogleToken({
          idToken: credential,
        });

        completeLogin(response);
      } catch (error) {
        toast({
          title: "Google login failed",
          description:
            error instanceof ApiError
              ? error.message
              : "Unable to sign in with Google right now.",
          variant: "destructive",
        });
      } finally {
        setIsGoogleLoading(false);
      }
    },
    [completeLogin],
  );

  useEffect(() => {
    if (!googleClientId) {
      setGoogleErrorMessage(
        "Google login is not configured. Add VITE_GOOGLE_CLIENT_ID in your frontend env.",
      );
      setIsGoogleReady(false);
      return;
    }

    const initializeGoogleButton = () => {
      const googleAccounts = window.google?.accounts?.id;
      const buttonContainer = googleButtonContainerRef.current;

      if (!googleAccounts || !buttonContainer) {
        return;
      }

      googleAccounts.initialize({
        client_id: googleClientId,
        callback: (response) => {
          void handleGoogleCredential(response.credential);
        },
        ux_mode: "popup",
      });

      const renderButton = () => {
        if (!googleButtonContainerRef.current) {
          return;
        }

        const buttonWidth = Math.max(
          0,
          Math.min(Math.floor(googleButtonContainerRef.current.offsetWidth), 380),
        );

        googleButtonContainerRef.current.innerHTML = "";
        googleAccounts.renderButton(googleButtonContainerRef.current, {
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "pill",
          width: buttonWidth,
          logo_alignment: "left",
        });
      };

      renderButton();

      const resizeObserver = new ResizeObserver(() => {
        renderButton();
      });

      resizeObserver.observe(buttonContainer);
      setIsGoogleReady(true);
      setGoogleErrorMessage(null);

      return () => {
        resizeObserver.disconnect();
      };
    };

    if (window.google?.accounts?.id) {
      return initializeGoogleButton();
    }

    const existingScript = document.getElementById(
      GOOGLE_GSI_SCRIPT_ID,
    ) as HTMLScriptElement | null;

    if (existingScript) {
      let cleanup: (() => void) | undefined;

      const onLoad = () => {
        cleanup = initializeGoogleButton();
      };
      const onError = () => {
        setGoogleErrorMessage("Failed to load Google sign-in script.");
        setIsGoogleReady(false);
      };

      existingScript.addEventListener("load", onLoad, { once: true });
      existingScript.addEventListener("error", onError, { once: true });

      return () => {
        cleanup?.();
        existingScript.removeEventListener("load", onLoad);
        existingScript.removeEventListener("error", onError);
      };
    }

    const script = document.createElement("script");
    script.id = GOOGLE_GSI_SCRIPT_ID;
    script.src = GOOGLE_GSI_SCRIPT_SRC;
    script.async = true;
    script.defer = true;

    let cleanup: (() => void) | undefined;

    script.onload = () => {
      cleanup = initializeGoogleButton();
    };
    script.onerror = () => {
      setGoogleErrorMessage("Failed to load Google sign-in script.");
      setIsGoogleReady(false);
    };

    document.body.appendChild(script);

    return () => {
      cleanup?.();
    };
  }, [googleClientId, handleGoogleCredential]);

  const onSubmit = handleSubmit(async (values) => {
    clearErrors();
    loginMutation.reset();

    try {
      const response = await loginMutation.mutateAsync({
        email: values.email.trim().toLowerCase(),
        password: values.password.trim(),
      });

      completeLogin(response);
    } catch (error) {
      if (error instanceof ApiError) {
        Object.entries(error.fieldErrors).forEach(([field, message]) => {
          const formField = apiFieldToFormField[field];

          if (formField) {
            setError(formField, {
              type: "server",
              message,
            });
          }
        });

        toast({
          title: "Login failed",
          description: error.message,
          variant: "destructive",
        });

        return;
      }

      toast({
        title: "Login failed",
        description: "Unable to sign in right now. Please try again.",
        variant: "destructive",
      });
    }
  });

  const showGlobalError =
    loginMutation.isError &&
    !(
      loginMutation.error instanceof ApiError &&
      Object.keys(loginMutation.error.fieldErrors).length
    );
  const globalErrorMessage =
    loginMutation.error instanceof ApiError
      ? loginMutation.error.message
      : "Unable to sign in right now. Please try again.";

  return (
    <AuthSplitLayout
      heroEyebrow={content.heroEyebrow}
      heroTitle={content.heroTitle}
      heroDescription={content.heroDescription}
      formEyebrow={content.formEyebrow}
      highlights={content.features}
    >
      <div className="mx-auto w-full min-w-0 max-w-[460px]">
        <h1 className="break-words px-1 text-center text-[clamp(2.25rem,9vw,3.35rem)] font-bold leading-[0.95] tracking-[-0.04em] text-[#423122]">
          {content.heading}
        </h1>
        <p className="mx-auto mt-4 max-w-md px-1 text-center text-sm leading-6 text-[#76624e] sm:text-base sm:leading-7">
          {content.subheading}
        </p>

        <form className="mt-8 min-w-0 space-y-5 sm:mt-10" onSubmit={onSubmit} noValidate>
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-sm font-semibold text-[#513f2e]"
            >
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#85715b]" />
              <Input
                {...register("email")}
                id="email"
                autoComplete="email"
                aria-invalid={Boolean(errors.email)}
                placeholder={content.emailPlaceholder}
                type="email"
                className={getInputClassName(Boolean(errors.email))}
              />
            </div>
            {errors.email ? (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-[#513f2e]"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#85715b]" />
              <Input
                {...register("password")}
                id="password"
                autoComplete="current-password"
                aria-invalid={Boolean(errors.password)}
                placeholder="Enter your password"
                type={showPass ? "text" : "password"}
                className={getInputClassName(Boolean(errors.password), true)}
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#85715b]"
                onClick={() => setShowPass((previous) => !previous)}
                aria-label={showPass ? "Hide password" : "Show password"}
              >
                {showPass ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password ? (
              <p className="text-xs text-destructive">
                {errors.password.message}
              </p>
            ) : null}
          </div>

          {showGlobalError ? (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {globalErrorMessage}
            </div>
          ) : null}

          <Button
            type="submit"
            className="h-12 w-full min-w-0 rounded-2xl bg-[#6b8440] px-4 text-base font-semibold text-white shadow-[0_20px_45px_-28px_rgba(107,132,64,0.9)] hover:bg-[#61783a]"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? "Logging in..." : "Login"}
          </Button>
        </form>

        <div className="relative my-7">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#dfd3bc]" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-[#fbf8f1] px-4 text-xs font-semibold uppercase tracking-[0.3em] text-[#a18a71]">
              Or
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="overflow-hidden rounded-2xl border border-[#dccdb3] bg-white px-2 py-2 shadow-[0_16px_40px_-32px_rgba(80,59,18,0.45)] sm:px-3">
            <div
              ref={googleButtonContainerRef}
              className="min-h-11 w-full min-w-0 overflow-hidden rounded-full"
            />
          </div>

          {!isGoogleReady && !googleErrorMessage ? (
            <p className="flex items-center justify-center gap-1 text-center text-xs text-[#8f7b65]">
              <Loader2 className="h-3 w-3 animate-spin" />
              Loading Google sign-in...
            </p>
          ) : null}

          {isGoogleLoading ? (
            <p className="flex items-center justify-center gap-1 text-center text-xs text-[#8f7b65]">
              <Loader2 className="h-3 w-3 animate-spin" />
              Signing in with Google...
            </p>
          ) : null}

          {googleErrorMessage ? (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-center text-xs text-destructive">
              {googleErrorMessage}
            </div>
          ) : null}
        </div>

        <p className="mt-8 text-center text-sm leading-6 text-[#7a6855]">
          Need an account?{" "}
          <Link
            to={content.signupPath}
            className="font-semibold text-[#6b8440] transition-colors hover:text-[#536730]"
          >
            {content.signupLabel}
          </Link>
        </p>
      </div>
    </AuthSplitLayout>
  );
};

export default Login;
