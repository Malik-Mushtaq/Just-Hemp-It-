import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";
import { getOrderHistory } from "@/lib/api/dashboard";
import {
  DashboardHero,
  DashboardLayout,
  DashboardPanel,
  DashboardStatCard,
} from "./Dashboard";
import { useAuth } from "@/context/AuthContext";
import { isDemoUser } from "@/lib/authAudience";
import { Boxes, ChartColumnBig, Package } from "lucide-react";

const PAGE_SIZE = 10;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "USD",
  }).format(Number.isFinite(value) ? value : 0);

const DashboardOrders = () => {
  const { user } = useAuth();
  const isDemo = isDemoUser(user);
  const [page, setPage] = useState(1);
  const orderHistoryQuery = useQuery({
    queryKey: ["order-history", page, PAGE_SIZE],
    queryFn: () => getOrderHistory({ page, limit: PAGE_SIZE }),
    placeholderData: (previousData) => previousData,
    retry: 1,
    enabled: !isDemo,
  });

  const demoOrders = [
    {
      order_id: "ORD-1023",
      status: "Pending",
      date: "Mar 31, 2026",
      items_count: 2,
      products: [],
      total: 51,
    },
  ];

  const orders = isDemo ? demoOrders : orderHistoryQuery.data?.orders || [];
  const totalPages = Math.max(orderHistoryQuery.data?.totalPages || 1, 1);
  const orderHistoryErrorMessage =
    orderHistoryQuery.error instanceof ApiError
      ? orderHistoryQuery.error.message
      : "Unable to load your order history right now.";

  return (
    <DashboardLayout>
      <DashboardHero
        eyebrow="Orders"
        title="Order History"
        description="Track what you ordered, when it shipped, and how your account activity is evolving over time."
      />

      {orderHistoryQuery.isError ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <div className="flex items-center justify-between gap-3">
            <p>{orderHistoryErrorMessage}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => orderHistoryQuery.refetch()}
            >
              Retry
            </Button>
          </div>
        </div>
      ) : null}

      <DashboardPanel>
        <div className="grid gap-4 md:grid-cols-3">
          <DashboardStatCard
            label="Latest Order"
            value={orders[0]?.order_id || "ORD-1023"}
            description="Most recent confirmed order in your account."
            icon={Package}
            valueClassName="text-[1.85rem]"
          />
          <DashboardStatCard
            label="Average Basket"
            value="$103.33"
            description="Average order value across current activity."
            icon={ChartColumnBig}
          />
          <DashboardStatCard
            label="Most Recent Status"
            value={orders[0]?.status || "Pending"}
            description="Latest order stage inside your account."
            icon={Boxes}
            valueClassName="text-[1.9rem] text-[#6b8440]"
          />
        </div>

        <div className="mt-5 rounded-[22px] border border-dashed border-[#dccaad] bg-[#fffdf8] px-6 py-10 text-center">
          <h2 className="text-[1.45rem] font-semibold text-[#463627]">
            Order history module ready for live data
          </h2>
          <p className="mt-2 text-sm text-[#7c6956]">
            The layout is now prepared for a richer table or timeline once real
            orders are connected.
          </p>
        </div>
      </DashboardPanel>

      <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-sm text-[#7b6956]">
        <p>
          Page {orderHistoryQuery.data?.page || page} of {totalPages}
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPage((previousPage) => Math.max(1, previousPage - 1))}
            disabled={page <= 1 || orderHistoryQuery.isFetching}
            className="rounded-full border-[#dac8aa] bg-[#fffdf7]"
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPage((previousPage) => previousPage + 1)}
            disabled={page >= totalPages || orderHistoryQuery.isFetching}
            className="rounded-full border-[#dac8aa] bg-[#fffdf7]"
          >
            Next
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardOrders;
