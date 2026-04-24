import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import {
  ChevronDown,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  Upload,
  User,
} from "lucide-react";
import AnnouncementBar from "@/components/AnnouncementBar";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import PageTransition from "@/components/PageTransition";
import AuthSplitLayout from "@/components/auth/AuthSplitLayout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import { signUp, signUpWholesaler } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";

const namePattern = /^[A-Za-z\s]+$/;
const noHtmlPattern = /^(?!.*<[^>]+>).*$/;

const retailerSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(1, "First name is required")
      .max(30, "30 characters are allowed in first name")
      .regex(namePattern, "Only alphabets and spaces are allowed in first name")
      .regex(noHtmlPattern, "HTML tags are not allowed"),
    lastName: z
      .string()
      .trim()
      .min(1, "Last name is required")
      .max(30, "30 characters are allowed in last name")
      .regex(namePattern, "Only alphabets and spaces are allowed in last name")
      .regex(noHtmlPattern, "HTML tags are not allowed"),
    email: z
      .string()
      .trim()
      .min(1, "Email is required")
      .max(100, "Email must not exceed 100 characters")
      .email("Please enter valid email")
      .regex(noHtmlPattern, "HTML tags are not allowed"),
    phoneNumber: z
      .string()
      .trim()
      .min(7, "Phone number is required")
      .max(25, "Phone number must not exceed 25 characters")
      .regex(noHtmlPattern, "HTML tags are not allowed"),
    password: z
      .string()
      .min(6, "Password must be between 6 and 30 characters")
      .max(30, "Password must be between 6 and 30 characters")
      .regex(noHtmlPattern, "HTML tags are not allowed"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const wholesaleSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(1, "First name is required")
      .max(30, "30 characters are allowed in first name")
      .regex(namePattern, "Only alphabets and spaces are allowed in first name")
      .regex(noHtmlPattern, "HTML tags are not allowed"),
    lastName: z
      .string()
      .trim()
      .min(1, "Last name is required")
      .max(30, "30 characters are allowed in last name")
      .regex(namePattern, "Only alphabets and spaces are allowed in last name")
      .regex(noHtmlPattern, "HTML tags are not allowed"),
    email: z
      .string()
      .trim()
      .min(1, "Email is required")
      .max(100, "Email must not exceed 100 characters")
      .email("Please enter valid email")
      .regex(noHtmlPattern, "HTML tags are not allowed"),
    phoneNumber: z
      .string()
      .trim()
      .min(7, "Phone number is required")
      .max(25, "Phone number must not exceed 25 characters")
      .regex(noHtmlPattern, "HTML tags are not allowed"),
    legalBusinessName: z
      .string()
      .trim()
      .min(1, "Legal business name is required")
      .max(100, "Legal business name must not exceed 100 characters"),
    dbaName: z.string().trim().max(100).optional().or(z.literal("")),
    address1: z.string().trim().min(1, "Address 1 is required").max(120),
    address2: z.string().trim().optional(),
    country: z.string().trim().min(1, "Country is required"),
    state: z.string().trim().min(1, "State is required"),
    city: z.string().trim().min(1, "City is required"),
    zipCode: z.string().trim().min(1, "ZIP code is required"),
    howDidYouHear: z.string().trim().optional(),
    salesRep: z.string().trim().optional(),
    agreeBound: z.boolean().refine((value) => value, {
      message: "You must agree before continuing",
    }),
    agreeBusiness: z.boolean().refine((value) => value, {
      message: "Business confirmation is required",
    }),
    agreeTerms: z.boolean().refine((value) => value, {
      message: "Terms and privacy policy agreement is required",
    }),
  });

type RetailerFormValues = z.infer<typeof retailerSchema>;
type WholesaleFormValues = z.infer<typeof wholesaleSchema>;
type SignUpVariant = "retailer" | "wholesale";

const apiFieldToFormField: Record<string, keyof RetailerFormValues | keyof WholesaleFormValues> = {
  first_name: "firstName",
  last_name: "lastName",
  email: "email",
  password: "password",
  phone: "phoneNumber",
  business_name: "legalBusinessName",
  dba_name: "dbaName",
  address1: "address1",
  address2: "address2",
  country: "country",
  state: "state",
  city: "city",
  zip: "zipCode",
  hear_about: "howDidYouHear",
  refer_by: "salesRep",
};

const getInputClassName = (hasError: boolean, withTrailingIcon = false) =>
  cn(
    "h-11 min-w-0 rounded-2xl border-[#d7c6a9] bg-[#fcfaf4] text-[#4a3928] placeholder:text-[#8f7b65] focus-visible:ring-[#6d8440]",
    withTrailingIcon ? "pl-11 pr-11" : "pl-11",
    hasError && "border-destructive focus-visible:ring-destructive",
  );

const wholesaleFieldClassName =
  "h-9 min-w-0 rounded-[4px] border-[#d9c5a2] bg-white px-3 text-[11px] text-[#534230] placeholder:text-[#9c876e] focus-visible:ring-1 focus-visible:ring-[#7b9446]";

const wholesaleSectionTitleClassName =
  "mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9f8a6f]";

const wholesaleStates = [
  "Alabama",
  "California",
  "Florida",
  "Georgia",
  "Illinois",
  "Nevada",
  "New York",
  "Texas",
];

const hearingOptions = [
  "Instagram",
  "Google Search",
  "Trade Show",
  "Friend Referral",
  "Existing Customer",
];

const uploadFields = [
  { key: "salesTax", label: "Sales Tax Certificate" },
  { key: "federalEin", label: "Federal EIN Document (EIN)" },
  { key: "businessLicense", label: "Business License" },
  { key: "voidCheque", label: "Void Cheque" },
  { key: "stateResale", label: "State Resale ID" },
] as const;

const signUpContent: Record<
  SignUpVariant,
  {
    heroEyebrow: string;
    heroTitle: string;
    heroDescription: string;
    formEyebrow: string;
    heading: string;
    subheading: string;
    submitLabel: string;
    loginPath: string;
    loginLabel: string;
    features: { title: string; description: string }[];
  }
> = {
  retailer: {
    heroEyebrow: "Retail Signup",
    heroTitle:
      "Open a retail account with the JUST HEMP IT brand system behind you.",
    heroDescription:
      "Register once and we'll help you get set up with product access, partner support, and the refreshed storefront experience.",
    formEyebrow: "Retailer Access",
    heading: "Create a Retailer Account",
    subheading:
      "Quick signup for retail partners. We will follow up with account details.",
    submitLabel: "Create Retailer Account",
    loginPath: "/retailer-login",
    loginLabel: "Login",
    features: [
      {
        title: "Store-ready onboarding",
        description:
          "A simple intake flow for new retail partners who want product access fast.",
      },
      {
        title: "Brand consistency",
        description:
          "Every retail touchpoint now shares the same earthy and premium visual direction.",
      },
    ],
  },
  wholesale: {
    heroEyebrow: "Wholesale Access",
    heroTitle:
      "Create your wholesale account with the same polished JUST HEMP IT experience.",
    heroDescription:
      "Submit your business details and our team will help you unlock ordering, pricing, and account support.",
    formEyebrow: "Wholesale Access",
    heading: "Create Your Account",
    subheading:
      "Please fill out all required fields below to register with JUST HEMP IT Wholesale.",
    submitLabel: "Sign Up",
    loginPath: "/wholesale-login",
    loginLabel: "Login",
    features: [],
  },
};

const SignUp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const variant: SignUpVariant = location.pathname.includes("wholesale")
    ? "wholesale"
    : "retailer";
  const content = signUpContent[variant];
  const [showPassword, setShowPassword] = useState(false);
  const [uploadNames, setUploadNames] = useState<Record<string, string>>({});
  const [uploadFiles, setUploadFiles] = useState<Record<string, File | null>>({});

  const redirectPath = useMemo(() => {
    const state = location.state as { from?: string } | undefined;

    if (typeof state?.from === "string" && state.from.startsWith("/")) {
      return state.from;
    }

    return "/dashboard";
  }, [location.state]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectPath]);

  const retailerForm = useForm<RetailerFormValues>({
    resolver: zodResolver(retailerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      password: "",
      confirmPassword: "",
    },
  });

  const wholesaleForm = useForm<WholesaleFormValues>({
    resolver: zodResolver(wholesaleSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      legalBusinessName: "",
      dbaName: "",
      address1: "",
      address2: "",
      country: "",
      state: "",
      city: "",
      zipCode: "",
      howDidYouHear: "",
      salesRep: "",
      agreeBound: false,
      agreeBusiness: false,
      agreeTerms: false,
    },
  });

  const retailerSignUpMutation = useMutation({
    mutationFn: signUp,
  });

  const wholesaleSignUpMutation = useMutation({
    mutationFn: signUpWholesaler,
  });

  const handleUploadChange =
    (key: string) => (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      setUploadFiles((previous) => ({
        ...previous,
        [key]: file || null,
      }));
      setUploadNames((previous) => ({
        ...previous,
        [key]: file?.name || "",
      }));
    };

  const submitRetailerAccount = async ({
    firstName,
    lastName,
    email,
    phoneNumber,
    password,
  }: RetailerFormValues) => {
    const response = await retailerSignUpMutation.mutateAsync({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim().toLowerCase(),
      password: password || "",
      phone: phoneNumber.trim(),
    });

    toast({
      title: "Account created",
      description: response.message,
    });

    navigate(content.loginPath);
  };

  const retailerOnSubmit = retailerForm.handleSubmit(async (values) => {
    retailerForm.clearErrors();
    retailerSignUpMutation.reset();

    try {
      await submitRetailerAccount(values);
      retailerForm.reset();
    } catch (error) {
      if (error instanceof ApiError) {
        Object.entries(error.fieldErrors).forEach(([field, message]) => {
          const formField = apiFieldToFormField[field] as keyof RetailerFormValues | undefined;

          if (formField) {
            retailerForm.setError(formField, {
              type: "server",
              message,
            });
          }
        });

        toast({
          title: "Signup failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Signup failed",
        description:
          "Unable to create your account right now. Please try again.",
        variant: "destructive",
      });
    }
  });

  const wholesaleOnSubmit = wholesaleForm.handleSubmit(async (values) => {
    wholesaleForm.clearErrors();
    wholesaleSignUpMutation.reset();

    const requiredFiles = {
      salesTax: uploadFiles.salesTax,
      federalEin: uploadFiles.federalEin,
      businessLicense: uploadFiles.businessLicense,
      voidCheque: uploadFiles.voidCheque,
      stateResale: uploadFiles.stateResale,
    };

    const missingFiles = Object.entries(requiredFiles)
      .filter(([, file]) => !file)
      .map(([key]) => uploadFields.find((field) => field.key === key)?.label || key);

    if (missingFiles.length) {
      toast({
        title: "Missing documents",
        description: `Please upload: ${missingFiles.join(", ")}.`,
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await wholesaleSignUpMutation.mutateAsync({
        first_name: values.firstName.trim(),
        last_name: values.lastName.trim(),
        email: values.email.trim().toLowerCase(),
        phone: values.phoneNumber.trim(),
        business_name: values.legalBusinessName.trim(),
        dba_name: values.dbaName.trim() || undefined,
        address1: values.address1.trim(),
        address2: values.address2.trim() || undefined,
        country: values.country.trim(),
        state: values.state.trim(),
        city: values.city.trim(),
        zip: values.zipCode.trim(),
        hear_about: values.howDidYouHear.trim() || undefined,
        refer_by: values.salesRep.trim() || undefined,
        sales_tax_certificate: requiredFiles.salesTax as File,
        fein: requiredFiles.federalEin as File,
        license: requiredFiles.businessLicense as File,
        void_cheque: requiredFiles.voidCheque as File,
        state_id: requiredFiles.stateResale as File,
      });

      toast({
        title: "Application submitted",
        description: response.message,
      });

      wholesaleForm.reset();
      setUploadFiles({});
      setUploadNames({});
      navigate(content.loginPath);
    } catch (error) {
      if (error instanceof ApiError) {
        Object.entries(error.fieldErrors).forEach(([field, message]) => {
          const formField = apiFieldToFormField[field] as keyof WholesaleFormValues | undefined;

          if (formField) {
            wholesaleForm.setError(formField, {
              type: "server",
              message,
            });
          }
        });

        toast({
          title: "Signup failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Signup failed",
        description:
          "Unable to create your account right now. Please try again.",
        variant: "destructive",
      });
    }
  });

  const renderRetailerPage = () => {
    const {
      register,
      formState: { errors },
    } = retailerForm;

    const showGlobalError =
      retailerSignUpMutation.isError &&
      !(
        retailerSignUpMutation.error instanceof ApiError &&
        Object.keys(retailerSignUpMutation.error.fieldErrors).length
      );
    const globalErrorMessage =
      retailerSignUpMutation.error instanceof ApiError
        ? retailerSignUpMutation.error.message
        : "Unable to create your account right now. Please try again.";

    return (
      <AuthSplitLayout
        heroEyebrow={content.heroEyebrow}
        heroTitle={content.heroTitle}
        heroDescription={content.heroDescription}
        formEyebrow={content.formEyebrow}
        highlights={content.features}
      >
        <div className="mx-auto w-full min-w-0 max-w-[480px]">
          <h1 className="break-words px-1 text-center text-[clamp(2.2rem,8vw,3.1rem)] font-bold leading-[0.96] tracking-[-0.04em] text-[#423122]">
            {content.heading}
          </h1>
          <p className="mx-auto mt-4 max-w-lg px-1 text-center text-sm leading-6 text-[#76624e] sm:text-base sm:leading-7">
            {content.subheading}
          </p>

          <form className="mt-8 min-w-0 space-y-5 sm:mt-10" onSubmit={retailerOnSubmit} noValidate>
            <div className="grid min-w-0 gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <label
                  htmlFor="firstName"
                  className="block text-sm font-semibold text-[#513f2e]"
                >
                  First Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#85715b]" />
                  <Input
                    {...register("firstName")}
                    id="firstName"
                    autoComplete="given-name"
                    aria-invalid={Boolean(errors.firstName)}
                    placeholder="Jordan"
                    className={getInputClassName(Boolean(errors.firstName))}
                  />
                </div>
                {errors.firstName ? (
                  <p className="text-xs text-destructive">
                    {errors.firstName.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="lastName"
                  className="block text-sm font-semibold text-[#513f2e]"
                >
                  Last Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#85715b]" />
                  <Input
                    {...register("lastName")}
                    id="lastName"
                    autoComplete="family-name"
                    aria-invalid={Boolean(errors.lastName)}
                    placeholder="Lee"
                    className={getInputClassName(Boolean(errors.lastName))}
                  />
                </div>
                {errors.lastName ? (
                  <p className="text-xs text-destructive">
                    {errors.lastName.message}
                  </p>
                ) : null}
              </div>
            </div>

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
                  placeholder="jordan@retailshop.com"
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
                htmlFor="phoneNumber"
                className="block text-sm font-semibold text-[#513f2e]"
              >
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#85715b]" />
                <Input
                  {...register("phoneNumber")}
                  id="phoneNumber"
                  autoComplete="tel"
                  aria-invalid={Boolean(errors.phoneNumber)}
                  placeholder="+1 (555) 000-1122"
                  type="tel"
                  className={getInputClassName(Boolean(errors.phoneNumber))}
                />
              </div>
              {errors.phoneNumber ? (
                <p className="text-xs text-destructive">
                  {errors.phoneNumber.message}
                </p>
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
                  autoComplete="new-password"
                  aria-invalid={Boolean(errors.password)}
                  placeholder="Create a password"
                  type={showPassword ? "text" : "password"}
                  className={getInputClassName(Boolean(errors.password), true)}
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#85715b]"
                  onClick={() => setShowPassword((previous) => !previous)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
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

            <div className="space-y-2">
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-semibold text-[#513f2e]"
              >
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#85715b]" />
                <Input
                  {...register("confirmPassword")}
                  id="confirmPassword"
                  autoComplete="new-password"
                  aria-invalid={Boolean(errors.confirmPassword)}
                  placeholder="Confirm your password"
                  type={showPassword ? "text" : "password"}
                  className={getInputClassName(
                    Boolean(errors.confirmPassword),
                    true,
                  )}
                />
              </div>
              {errors.confirmPassword ? (
                <p className="text-xs text-destructive">
                  {errors.confirmPassword.message}
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
              disabled={retailerSignUpMutation.isPending}
            >
              {retailerSignUpMutation.isPending
                ? "Creating Account..."
                : content.submitLabel}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm leading-6 text-[#7a6855]">
            Already have an account?{" "}
            <Link
              to={content.loginPath}
              className="font-semibold text-[#6b8440] transition-colors hover:text-[#536730]"
            >
              {content.loginLabel}
            </Link>
          </p>
        </div>
      </AuthSplitLayout>
    );
  };

  if (variant === "retailer") {
    return renderRetailerPage();
  }

  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = wholesaleForm;

  const showGlobalError =
    wholesaleSignUpMutation.isError &&
    !(
      wholesaleSignUpMutation.error instanceof ApiError &&
      Object.keys(wholesaleSignUpMutation.error.fieldErrors).length
    );
  const globalErrorMessage =
    wholesaleSignUpMutation.error instanceof ApiError
      ? wholesaleSignUpMutation.error.message
      : "Unable to create your account right now. Please try again.";

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <AnnouncementBar />
        <Navbar />
        <main className="px-3 py-6 sm:px-5 sm:py-8 lg:px-8 lg:py-10">
          <div className="mx-auto max-w-[760px]">
            <div className="rounded-[18px] border border-[#dbcaa9] bg-[#fbf7ef] px-4 py-5 shadow-[0_24px_90px_-60px_rgba(88,69,29,0.55)] sm:px-6 sm:py-6 lg:px-7">
              <div className="mx-auto max-w-[650px]">
                <p className="text-center text-[10px] font-semibold uppercase tracking-[0.26em] text-[#96a06d] sm:tracking-[0.32em]">
                  {content.formEyebrow}
                </p>
                <h1 className="mt-2 text-center text-[2rem] font-semibold leading-none text-[#463525] sm:text-[2.3rem]">
                  {content.heading}
                </h1>
                <p className="mx-auto mt-2 max-w-[520px] text-center text-[10px] leading-5 text-[#7f6d57] sm:text-[11px]">
                  {content.subheading}
                </p>

                <form className="mt-6 space-y-5" onSubmit={wholesaleOnSubmit} noValidate>
                  <section>
                    <h2 className={wholesaleSectionTitleClassName}>
                      Contact Information
                    </h2>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div>
                        <Input
                          {...register("firstName")}
                          placeholder="First Name *"
                          className={cn(
                            wholesaleFieldClassName,
                            errors.firstName && "border-destructive",
                          )}
                        />
                        {errors.firstName ? (
                          <p className="mt-1 text-[10px] text-destructive">
                            {errors.firstName.message}
                          </p>
                        ) : null}
                      </div>
                      <div>
                        <Input
                          {...register("lastName")}
                          placeholder="Last Name *"
                          className={cn(
                            wholesaleFieldClassName,
                            errors.lastName && "border-destructive",
                          )}
                        />
                        {errors.lastName ? (
                          <p className="mt-1 text-[10px] text-destructive">
                            {errors.lastName.message}
                          </p>
                        ) : null}
                      </div>
                      <div>
                        <Input
                          {...register("email")}
                          placeholder="Email *"
                          className={cn(
                            wholesaleFieldClassName,
                            errors.email && "border-destructive",
                          )}
                        />
                        {errors.email ? (
                          <p className="mt-1 text-[10px] text-destructive">
                            {errors.email.message}
                          </p>
                        ) : null}
                      </div>
                      <div>
                        <Input
                          {...register("phoneNumber")}
                          placeholder="Phone *"
                          className={cn(
                            wholesaleFieldClassName,
                            errors.phoneNumber && "border-destructive",
                          )}
                        />
                        {errors.phoneNumber ? (
                          <p className="mt-1 text-[10px] text-destructive">
                            {errors.phoneNumber.message}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </section>

                  <section>
                    <h2 className={wholesaleSectionTitleClassName}>
                      Business Information
                    </h2>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div>
                        <Input
                          {...register("legalBusinessName")}
                          placeholder="Legal Business Name *"
                          className={cn(
                            wholesaleFieldClassName,
                            errors.legalBusinessName && "border-destructive",
                          )}
                        />
                        {errors.legalBusinessName ? (
                          <p className="mt-1 text-[10px] text-destructive">
                            {errors.legalBusinessName.message}
                          </p>
                        ) : null}
                      </div>
                      <div>
                        <Input
                          {...register("dbaName")}
                          placeholder="DBA Name"
                          className={cn(
                            wholesaleFieldClassName,
                            errors.dbaName && "border-destructive",
                          )}
                        />
                        {errors.dbaName ? (
                          <p className="mt-1 text-[10px] text-destructive">
                            {errors.dbaName.message}
                          </p>
                        ) : null}
                      </div>
                      <div>
                        <Input
                          {...register("address1")}
                          placeholder="Address 1 *"
                          className={cn(
                            wholesaleFieldClassName,
                            errors.address1 && "border-destructive",
                          )}
                        />
                        {errors.address1 ? (
                          <p className="mt-1 text-[10px] text-destructive">
                            {errors.address1.message}
                          </p>
                        ) : null}
                      </div>
                      <div>
                        <Input
                          {...register("address2")}
                          placeholder="Address 2"
                          className={cn(wholesaleFieldClassName)}
                        />
                      </div>
                      <div>
                        <Input
                          {...register("country")}
                          placeholder="Country *"
                          className={cn(
                            wholesaleFieldClassName,
                            errors.country && "border-destructive",
                          )}
                        />
                        {errors.country ? (
                          <p className="mt-1 text-[10px] text-destructive">
                            {errors.country.message}
                          </p>
                        ) : null}
                      </div>
                      <div>
                        <Select
                          value={watch("state")}
                          onValueChange={(value) =>
                            setValue("state", value, {
                              shouldDirty: true,
                              shouldValidate: true,
                            })
                          }
                        >
                          <SelectTrigger
                            className={cn(
                              wholesaleFieldClassName,
                              "justify-between pr-2 [&>span]:text-[11px]",
                              errors.state && "border-destructive",
                            )}
                          >
                            <SelectValue placeholder="Select State *" />
                          </SelectTrigger>
                          <SelectContent>
                            {wholesaleStates.map((state) => (
                              <SelectItem key={state} value={state}>
                                {state}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.state ? (
                          <p className="mt-1 text-[10px] text-destructive">
                            {errors.state.message}
                          </p>
                        ) : null}
                      </div>
                      <div>
                        <Input
                          {...register("city")}
                          placeholder="City *"
                          className={cn(
                            wholesaleFieldClassName,
                            errors.city && "border-destructive",
                          )}
                        />
                        {errors.city ? (
                          <p className="mt-1 text-[10px] text-destructive">
                            {errors.city.message}
                          </p>
                        ) : null}
                      </div>
                      <div>
                        <Input
                          {...register("zipCode")}
                          placeholder="ZIP Code *"
                          className={cn(
                            wholesaleFieldClassName,
                            errors.zipCode && "border-destructive",
                          )}
                        />
                        {errors.zipCode ? (
                          <p className="mt-1 text-[10px] text-destructive">
                            {errors.zipCode.message}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </section>

                  <section>
                    <h2 className={wholesaleSectionTitleClassName}>
                      Additional Information
                    </h2>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div>
                        <Select
                          value={watch("howDidYouHear")}
                          onValueChange={(value) =>
                            setValue("howDidYouHear", value, {
                              shouldDirty: true,
                              shouldValidate: true,
                            })
                          }
                        >
                          <SelectTrigger
                            className={cn(
                              wholesaleFieldClassName,
                              "justify-between pr-2 [&>span]:text-[11px]",
                            )}
                          >
                            <SelectValue placeholder="How did you hear about this?" />
                          </SelectTrigger>
                          <SelectContent>
                            {hearingOptions.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <div className="relative">
                          <Input
                            {...register("salesRep")}
                            placeholder="Refer by Sales Rep"
                            className={cn(wholesaleFieldClassName, "pr-9")}
                          />
                          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#715f49]" />
                        </div>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h2 className={wholesaleSectionTitleClassName}>
                      Upload Required Documents
                    </h2>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {uploadFields.map((field) => (
                        <label
                          key={field.key}
                          className="flex min-h-[72px] cursor-pointer flex-col items-center justify-center rounded-[8px] border border-dashed border-[#d9c5a2] bg-white px-3 py-3 text-center transition-colors hover:bg-[#f8f2e6]"
                        >
                          <input
                            type="file"
                            className="sr-only"
                            onChange={handleUploadChange(field.key)}
                          />
                          <Upload className="h-4 w-4 text-[#94a05c]" />
                          <span className="mt-2 text-[10px] font-medium text-[#5a4734]">
                            {field.label}
                          </span>
                          <span className="mt-1 text-[8px] uppercase tracking-[0.18em] text-[#9d8b78]">
                            {uploadNames[field.key] || "PDF, PNG, JPG"}
                          </span>
                        </label>
                      ))}
                    </div>
                  </section>

                  <section>
                    <h2 className={wholesaleSectionTitleClassName}>Agreements</h2>
                    <div className="space-y-2 text-[10px] text-[#7b6850]">
                      <label className="flex items-start gap-2">
                        <Checkbox
                          checked={watch("agreeBound")}
                          onCheckedChange={(checked) =>
                            setValue("agreeBound", checked === true, {
                              shouldDirty: true,
                              shouldValidate: true,
                            })
                          }
                          className="mt-0.5 h-3.5 w-3.5 rounded-[2px] border-[#b99f75] data-[state=checked]:bg-[#6b8440]"
                        />
                        <span>
                          I have read, understand and agree to be bound by the above.
                        </span>
                      </label>
                      {errors.agreeBound ? (
                        <p className="text-[10px] text-destructive">
                          {errors.agreeBound.message}
                        </p>
                      ) : null}

                      <label className="flex items-start gap-2">
                        <Checkbox
                          checked={watch("agreeBusiness")}
                          onCheckedChange={(checked) =>
                            setValue("agreeBusiness", checked === true, {
                              shouldDirty: true,
                              shouldValidate: true,
                            })
                          }
                          className="mt-0.5 h-3.5 w-3.5 rounded-[2px] border-[#b99f75] data-[state=checked]:bg-[#6b8440]"
                        />
                        <span>
                          I agree that I am a business and that I am selling this account for RESALE purposes only.
                        </span>
                      </label>
                      {errors.agreeBusiness ? (
                        <p className="text-[10px] text-destructive">
                          {errors.agreeBusiness.message}
                        </p>
                      ) : null}

                      <label className="flex items-start gap-2">
                        <Checkbox
                          checked={watch("agreeTerms")}
                          onCheckedChange={(checked) =>
                            setValue("agreeTerms", checked === true, {
                              shouldDirty: true,
                              shouldValidate: true,
                            })
                          }
                          className="mt-0.5 h-3.5 w-3.5 rounded-[2px] border-[#b99f75] data-[state=checked]:bg-[#6b8440]"
                        />
                        <span>
                          I have read and agree to JUST HEMP IT Terms of Use & Privacy Policy.
                        </span>
                      </label>
                      {errors.agreeTerms ? (
                        <p className="text-[10px] text-destructive">
                          {errors.agreeTerms.message}
                        </p>
                      ) : null}
                    </div>
                  </section>

                  {showGlobalError ? (
                    <div className="rounded-[8px] border border-destructive/20 bg-destructive/5 px-3 py-2 text-[11px] text-destructive">
                      {globalErrorMessage}
                    </div>
                  ) : null}

                  <div className="flex flex-col items-center pt-1">
                    <Button
                      type="submit"
                      className="h-9 min-w-[114px] rounded-[8px] bg-[#6b8440] px-8 text-[12px] font-semibold text-white hover:bg-[#61783a]"
                      disabled={wholesaleSignUpMutation.isPending}
                    >
                      {wholesaleSignUpMutation.isPending ? "Signing Up..." : content.submitLabel}
                    </Button>
                    <p className="mt-2 text-center text-[9px] text-[#9a876d]">
                      Already have an account?{" "}
                      <Link
                        to={content.loginPath}
                        className="font-semibold text-[#6b8440] hover:text-[#536730]"
                      >
                        {content.loginLabel}
                      </Link>
                    </p>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </PageTransition>
  );
};

export default SignUp;
