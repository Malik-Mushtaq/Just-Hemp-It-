import { ReactNode, useMemo, useState } from "react";
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
import { isDemoUser } from "@/lib/authAudience";
import { ApiError } from "@/lib/api/client";
import { getDashboard } from "@/lib/api/dashboard";
import { cn } from "@/lib/utils";

const sidebarLinks = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "My Profile", href: "/dashboard/profile", icon: UserCircle2 },
  { label: "Order History", href: "/dashboard/orders", icon: Boxes },
  { label: "Payment Methods", href: "/dashboard/payments", icon: CreditCard },
  { label: "Change Password", href: "/dashboard/password", icon: KeyRound },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);

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
  <section className="rounded-[28px] bg-gradient-to-r from-[#6d5421] via-[#6c7e34] to-[#95ad3e] px-6 py-7 text-[#fbf6ea] shadow-[0_30px_80px_-45px_rgba(88,69,29,0.45)] sm:px-8 sm:py-9 lg:px-10">
    <span className="inline-flex rounded-full border border-white/25 bg-white/8 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#f4ecd7]">
      {eyebrow}
    </span>
    <h1 className="mt-4 text-[clamp(2rem,5vw,3rem)] font-bold leading-[1.02] tracking-[-0.04em] text-[#fcf7eb]">
      {title}
    </h1>
    <p className="mt-4 max-w-3xl text-sm leading-7 text-[#f3ead8] sm:text-base">
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
      "rounded-[28px] border border-[#e1d2ba] bg-[#fffdf7] p-5 shadow-[0_28px_80px_-55px_rgba(88,69,29,0.38)] sm:p-6",
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
  <div className="rounded-[26px] border border-[#eadcc7] bg-[#fffdf7] p-5 shadow-[0_20px_55px_-45px_rgba(88,69,29,0.35)]">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#84725f]">
          {label}
        </p>
        <p
          className={cn(
            "mt-3 text-[2rem] font-medium leading-none text-[#453526]",
            valueClassName,
          )}
        >
          {value}
        </p>
        <p className="mt-3 text-sm leading-6 text-[#7a6856]">{description}</p>
      </div>
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-[#eff0e4] text-[#73854b]">
        <Icon className="h-5 w-5" />
      </div>
    </div>
  </div>
);

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const displayName = getDashboardDisplayName(user);

  const handleLogout = () => {
    setMobileOpen(false);
    logout({ reason: "manual" });
  };

  return (
    <div className="min-h-screen bg-background">
      <AnnouncementBar />
      <Navbar />
      <main className="overflow-hidden px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <div className="mx-auto max-w-[1380px]">
          <div className="relative overflow-hidden rounded-[34px] border border-[#dccdaf] bg-[#f6f0e4] p-4 shadow-[0_35px_95px_-60px_rgba(88,69,29,0.5)] sm:p-5 lg:p-6">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.95),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(151,169,75,0.18),transparent_30%)]" />
            <div className="relative grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)]">
              <button
                type="button"
                className="fixed bottom-4 right-4 z-50 rounded-full bg-[#6b8440] p-3 text-white shadow-lg lg:hidden"
                onClick={() => setMobileOpen((previous) => !previous)}
              >
                {mobileOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>

              <aside
                className={cn(
                  "hidden lg:block",
                  mobileOpen &&
                    "fixed inset-0 z-40 block bg-[#f6f0e4]/95 px-4 pb-6 pt-24 backdrop-blur-sm lg:static lg:bg-transparent lg:px-0 lg:pb-0 lg:pt-0",
                )}
              >
                <div className="rounded-[28px] border border-[#e0d2bc] bg-[#fffdf8] p-4 shadow-[0_24px_60px_-50px_rgba(88,69,29,0.4)] sm:p-5">
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

              <div className="space-y-5">{children}</div>
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
        : formatCurrency(dashboardData?.total_spent ?? 0),
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
            <h2 className="text-[1.7rem] font-semibold text-[#453526]">
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

        <div className="mt-5 overflow-x-auto">
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
                      {formatCurrency(order.total)}
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
