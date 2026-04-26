import { ReactNode, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "react-router-dom";
import {
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  KeyRound,
  UserCircle2,
  X,
  Boxes,
  Wallet,
  ChartColumnBig,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import AnnouncementBar from "@/components/AnnouncementBar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { isDemoUser } from "@/lib/authAudience";
import { ApiError } from "@/lib/api/client";
import { getDashboard } from "@/lib/api/dashboard";
import { formatGBP } from "@/lib/currency";
import { cn } from "@/lib/utils";

const sidebarLinks = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "My Profile", href: "/dashboard/profile", icon: UserCircle2 },
  { label: "Order History", href: "/dashboard/orders", icon: Boxes },
  { label: "Payment Methods", href: "/dashboard/payments", icon: CreditCard },
  { label: "Change Password", href: "/dashboard/password", icon: KeyRound },
];

const getStatusClassName = (status: string) => {
  const normalizedStatus = status.toLowerCase();

  if (normalizedStatus === "delivered") {
    return "bg-primary/10 text-primary";
  }

  if (normalizedStatus === "pending") {
    return "bg-[#eef2df] text-[#6b8440]";
  }

  return "bg-accent/10 text-accent";
};

export const getDashboardDisplayName = (
  user:
    | {
        first_name?: string;
        last_name?: string;
      }
    | null
    | undefined,
) => {
  const fullName = [user?.first_name, user?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || "Account Holder";
};

export const DashboardHero = ({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) => (
  <section className="rounded-[24px] bg-gradient-to-r from-[#6d5421] via-[#6c7e34] to-[#95ad3e] px-4 py-5 text-[#fbf6ea] shadow-[0_30px_80px_-45px_rgba(88,69,29,0.45)] sm:rounded-[28px] sm:px-8 sm:py-9 lg:px-10">
    <span className="inline-flex rounded-full border border-white/25 bg-white/8 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.24em] text-[#f4ecd7] sm:px-4 sm:text-[10px] sm:tracking-[0.3em]">
      {eyebrow}
    </span>
    <h1 className="mt-3 text-[clamp(1.8rem,8vw,3rem)] font-bold leading-[1.02] tracking-[-0.04em] text-[#fcf7eb] sm:mt-4">
      {title}
    </h1>
    <p className="mt-3 max-w-3xl text-sm leading-6 text-[#f3ead8] sm:mt-4 sm:text-base sm:leading-7">
      {description}
    </p>
  </section>
);

export const DashboardPanel = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <section
    className={cn(
      "rounded-[24px] border border-[#e1d2ba] bg-[#fffdf7] p-4 shadow-[0_28px_80px_-55px_rgba(88,69,29,0.38)] sm:rounded-[28px] sm:p-6",
      className,
    )}
  >
    {children}
  </section>
);

export const DashboardStatCard = ({
  label,
  value,
  description,
  icon: Icon,
  valueClassName,
}: {
  label: string;
  value: string;
  description: string;
  icon: typeof Package;
  valueClassName?: string;
}) => (
  <div className="rounded-[22px] border border-[#eadcc7] bg-[#fffdf7] p-4 shadow-[0_20px_55px_-45px_rgba(88,69,29,0.35)] sm:rounded-[26px] sm:p-5">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#84725f]">
          {label}
        </p>
        <p
          className={cn(
            "mt-2 text-[1.7rem] font-medium leading-none text-[#453526] sm:mt-3 sm:text-[2rem]",
            valueClassName,
          )}
        >
          {value}
        </p>
        <p className="mt-2 text-sm leading-6 text-[#7a6856] sm:mt-3">
          {description}
        </p>
      </div>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[#eff0e4] text-[#73854b] sm:h-11 sm:w-11 sm:rounded-[16px]">
        <Icon className="h-5 w-5" />
      </div>
    </div>
  </div>
);

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);
  const displayName = getDashboardDisplayName(user);
  const activeLink =
    sidebarLinks.find((link) => location.pathname === link.href) ||
    sidebarLinks[0];

  const handleLogout = () => {
    setMobileOpen(false);
    logout({ reason: "manual" });
  };

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <AnnouncementBar />
        <Navbar />
        <main className="px-3 py-4">
          <div className="mx-auto max-w-md space-y-4">
            <section className="rounded-[24px] border border-[#dccdaf] bg-[#f6f0e4] p-3 shadow-[0_30px_70px_-52px_rgba(88,69,29,0.45)]">
              <div className="flex items-center justify-between gap-3 rounded-[20px] bg-[#fffdf8] px-3 py-3 shadow-[0_18px_36px_-30px_rgba(88,69,29,0.26)]">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#8c7964]">
                    Account
                  </p>
                  <p className="mt-1 truncate text-sm font-semibold text-[#453526]">
                    {activeLink.label}
                  </p>
                </div>
                <button
                  type="button"
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#6b8440] text-white shadow-[0_18px_38px_-18px_rgba(107,132,64,0.85)]"
                  onClick={() => setMobileOpen(true)}
                  aria-label="Open dashboard menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-3 rounded-[22px] bg-gradient-to-r from-[#6c5421] via-[#6f7f35] to-[#94ac3d] px-4 py-4 text-[#fcf7eb] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#f3ebd6]">
                  {displayName}
                </p>
                <p className="mt-2 text-sm leading-6 text-[#f7efde]">
                  Manage orders, profile details, payments, and security from a mobile-first dashboard.
                </p>
              </div>

              <div className="-mx-1 mt-3 overflow-x-auto pb-1">
                <div className="flex min-w-max gap-2 px-1">
                  {sidebarLinks.map((link) => {
                    const isActive = location.pathname === link.href;

                    return (
                      <Link
                        key={link.href}
                        to={link.href}
                        className={cn(
                          "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors",
                          isActive
                            ? "border-[#6b8440] bg-[#6b8440] text-white shadow-[0_16px_34px_-22px_rgba(107,132,64,0.8)]"
                            : "border-[#dccdaf] bg-[#fffdf8] text-[#5f5244]",
                        )}
                      >
                        <link.icon className="h-3.5 w-3.5" />
                        {link.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </section>

            <div className="space-y-4">{children}</div>
          </div>
        </main>

        {mobileOpen ? (
          <>
            <button
              type="button"
              aria-label="Close dashboard menu overlay"
              className="fixed inset-0 z-40 bg-[#2f261d]/40 backdrop-blur-[2px]"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="fixed inset-y-0 right-0 z-50 flex w-[86vw] max-w-[320px] flex-col bg-[#fffdf8] p-4 shadow-[-22px_0_60px_-28px_rgba(47,38,29,0.48)]">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#8c7964]">
                    Dashboard Menu
                  </p>
                  <p className="mt-1 truncate text-base font-semibold text-[#453526]">
                    {displayName}
                  </p>
                </div>
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#f2eadb] text-[#5f5244]"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close dashboard menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="mt-5 space-y-2">
                {sidebarLinks.map((link) => {
                  const isActive = location.pathname === link.href;

                  return (
                    <Link
                      key={link.href}
                      to={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-[16px] px-4 py-3 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-[#6b8440] text-white shadow-[0_16px_34px_-22px_rgba(107,132,64,0.8)]"
                          : "bg-[#faf5eb] text-[#5f5244]",
                      )}
                    >
                      <link.icon className="h-4 w-4" />
                      {link.label}
                    </Link>
                  );
                })}
              </nav>

              <button
                type="button"
                className="mt-auto flex w-full items-center justify-center gap-2 rounded-[16px] border border-[#f2c9c3] bg-[#fff4f1] px-4 py-3 text-sm font-medium text-[#ff3d37]"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </aside>
          </>
        ) : null}

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AnnouncementBar />
      <Navbar />
      <main className="overflow-hidden px-6 py-8 lg:px-8 lg:py-10">
        <div className="mx-auto max-w-[1380px]">
          <div className="relative overflow-hidden rounded-[34px] border border-[#dccdaf] bg-[#f6f0e4] p-5 shadow-[0_35px_95px_-60px_rgba(88,69,29,0.5)] lg:p-6">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.95),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(151,169,75,0.18),transparent_30%)]" />
            <div className="relative grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)]">
              <aside className="hidden lg:block">
                <div className="rounded-[28px] border border-[#e0d2bc] bg-[#fffdf8] p-5 shadow-[0_24px_60px_-50px_rgba(88,69,29,0.4)]">
                  <div className="rounded-[26px] bg-gradient-to-br from-[#6c5421] via-[#6f7f35] to-[#94ac3d] p-5 text-[#fcf7eb] shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]">
                    <span className="inline-flex rounded-full border border-white/25 bg-white/8 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#f5edd8]">
                      Account
                    </span>
                    <div className="mt-4 flex items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/10">
                        <UserCircle2 className="h-7 w-7 text-[#f8f1df]" />
                      </div>
                      <div>
                        <p className="text-[1.05rem] font-semibold leading-8 text-[#fdf8ef]">
                          {displayName}
                        </p>
                        <p className="max-w-[150px] text-sm leading-6 text-[#eaddc5]">
                          Manage your JUST HEMP IT profile
                        </p>
                      </div>
                    </div>
                  </div>

                  <nav className="mt-5 space-y-1.5">
                    {sidebarLinks.map((link) => {
                      const isActive = location.pathname === link.href;

                      return (
                        <Link
                          key={link.href}
                          to={link.href}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            "flex items-center gap-3 rounded-[14px] px-4 py-3 text-sm transition-colors",
                            isActive
                              ? "bg-[#6b8440] text-white shadow-[0_18px_35px_-22px_rgba(107,132,64,0.85)]"
                              : "text-[#5f5244] hover:bg-[#f1eadb]",
                          )}
                        >
                          <link.icon className="h-4 w-4" />
                          <span className="font-medium">{link.label}</span>
                        </Link>
                      );
                    })}
                  </nav>

                  <button
                    type="button"
                    className="mt-5 flex w-full items-center gap-3 rounded-[14px] px-4 py-3 text-sm font-medium text-[#ff3d37] transition-colors hover:bg-[#fff1ef]"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </aside>

              <div className="min-w-0 space-y-5">{children}</div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

const DashboardHome = () => {
  const { user } = useAuth();
  const isDemo = isDemoUser(user);
  const displayName = getDashboardDisplayName(user);

  const dashboardQuery = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboard,
    retry: 1,
    enabled: !isDemo,
  });

  const dashboardData = isDemo
    ? {
        total_orders: 12,
        total_spent: 1240,
        recent_order: "ORD-1023",
        recent_orders: [
          {
            order_id: "ORD-1023",
            date: "Mar 31, 2026",
            items: 2,
            total: 51,
            status: "Pending",
          },
        ],
      }
    : dashboardQuery.data;

  const dashboardErrorMessage =
    dashboardQuery.error instanceof ApiError
      ? dashboardQuery.error.message
      : "Unable to load dashboard data right now.";

  const cards = [
    {
      label: "Total Orders",
      value: dashboardQuery.isLoading && !isDemo
        ? "..."
        : String(dashboardData?.total_orders ?? 0),
      description: "Across retail and reorder activity",
      icon: Package,
    },
    {
      label: "Total Spent",
      value: dashboardQuery.isLoading && !isDemo
        ? "..."
        : `£${(dashboardData?.total_spent ?? 0)}`,
      description: "Tracked inside your account",
      icon: Wallet,
    },
    {
      label: "Recent Order",
      value: dashboardQuery.isLoading && !isDemo
        ? "..."
        : dashboardData?.recent_order || "N/A",
      description: "Awaiting the next update",
      icon: ChartColumnBig,
      valueClassName:
        dashboardData?.recent_order && dashboardData.recent_order.length > 10
          ? "text-[1.6rem]"
          : undefined,
    },
  ];

  return (
    <DashboardLayout>
      <DashboardHero
        eyebrow="Dashboard"
        title={`Welcome back, ${displayName}`}
        description="Your account area now follows the same olive, gold, and earthy visual system as the storefront, giving the whole JUST HEMP IT experience a more premium feel."
      />

      {dashboardQuery.isError ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p>{dashboardErrorMessage}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => dashboardQuery.refetch()}
            >
              Retry
            </Button>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-3">
        {cards.map((card) => (
          <DashboardStatCard key={card.label} {...card} />
        ))}
      </div>

      <DashboardPanel>
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#eadcc7] pb-4">
          <div>
            <h2 className="text-[1.45rem] font-semibold text-[#453526] sm:text-[1.7rem]">
              Recent Orders
            </h2>
            <p className="mt-1 text-sm text-[#7b6956]">
              A cleaner activity overview for the last 30 days.
            </p>
          </div>
          <span className="rounded-full bg-[#f6efd8] px-4 py-2 text-xs font-medium text-[#7b8448]">
            Last 30 days
          </span>
        </div>

        <div className="mt-5 space-y-3 sm:hidden">
          {dashboardData?.recent_orders?.length ? (
            dashboardData.recent_orders.map((order) => (
              <article
                key={order.order_id}
                className="rounded-[20px] border border-[#eadcc7] bg-[#fffdfa] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#8a7762]">
                      Order
                    </p>
                    <p className="mt-1 truncate text-base font-semibold text-[#4a3a2b]">
                      {order.order_id}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${getStatusClassName(order.status)}`}
                  >
                    {order.status}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs uppercase tracking-[0.12em] text-[#8a7762]">
                      Date
                    </p>
                    <p className="mt-1 text-[#4a3a2b]">{order.date}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.12em] text-[#8a7762]">
                      Items
                    </p>
                    <p className="mt-1 text-[#4a3a2b]">{order.items}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs uppercase tracking-[0.12em] text-[#8a7762]">
                      Total
                    </p>
                    <p className="mt-1 text-base font-semibold text-[#4a3a2b]">
                      {formatGBP(order.total)}
                    </p>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-[20px] border border-dashed border-[#dccaad] bg-[#fffdf8] px-4 py-8 text-center text-sm text-[#7a6855]">
              {dashboardQuery.isLoading
                ? "Loading recent orders..."
                : "No orders yet."}
            </div>
          )}
        </div>

        <div className="mt-5 hidden overflow-x-auto sm:block">
          <table className="w-full min-w-[620px] text-sm">
            <thead>
              <tr className="border-b border-[#eadcc7] text-left text-[11px] uppercase tracking-[0.14em] text-[#8a7762]">
                {["Order ID", "Date", "Items", "Total", "Status"].map(
                  (heading) => (
                    <th key={heading} className="px-4 py-3 font-medium first:pl-0">
                      {heading}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {dashboardData?.recent_orders?.length ? (
                dashboardData.recent_orders.map((order) => (
                  <tr
                    key={order.order_id}
                    className="border-b border-[#f0e5d3] text-[#4a3a2b]"
                  >
                    <td className="px-4 py-4 font-medium first:pl-0">
                      {order.order_id}
                    </td>
                    <td className="px-4 py-4 text-[#7a6855]">{order.date}</td>
                    <td className="px-4 py-4">{order.items}</td>
                    <td className="px-4 py-4 font-medium">
                      {formatGBP(order.total)}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClassName(order.status)}`}
                      >
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-sm text-[#7a6855]"
                  >
                    {dashboardQuery.isLoading
                      ? "Loading recent orders..."
                      : "No orders yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </DashboardPanel>
    </DashboardLayout>
  );
};

export default DashboardHome;
export { DashboardLayout };
