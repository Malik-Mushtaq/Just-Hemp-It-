import { AuthUser } from "@/lib/api/auth";

export type PricingAudience = "retailer" | "wholesaler";

export const RETAILER_DEMO_EMAIL = "malik20mushtaqali@gmail.com";
export const WHOLESALER_DEMO_EMAIL = "malik20mushtaqali+1@gmail.com";
export const DEMO_PASSWORD = "Malik123";
export const DEMO_TOKEN_PREFIX = "demo-static-token-";

export const getPricingAudience = (
  user: Pick<AuthUser, "email" | "role"> | null | undefined,
): PricingAudience => {
  if (!user) {
    return "retailer";
  }

  const normalizedEmail = user.email.trim().toLowerCase();
  const normalizedRole = user.role.trim().toLowerCase();

  if (
    normalizedRole === "wholesaler" ||
    normalizedRole === "wholesale" ||
    normalizedEmail === WHOLESALER_DEMO_EMAIL
  ) {
    return "wholesaler";
  }

  return "retailer";
};

export const isDemoUser = (
  user: Pick<AuthUser, "email"> | null | undefined,
) => {
  if (!user) {
    return false;
  }

  const normalizedEmail = user.email.trim().toLowerCase();

  return (
    normalizedEmail === RETAILER_DEMO_EMAIL ||
    normalizedEmail === WHOLESALER_DEMO_EMAIL
  );
};

export const isDemoToken = (token: string | null | undefined) =>
  typeof token === "string" && token.startsWith(DEMO_TOKEN_PREFIX);
