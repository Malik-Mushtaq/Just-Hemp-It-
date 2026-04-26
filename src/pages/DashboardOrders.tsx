import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";
import { getOrderHistory } from "@/lib/api/dashboard";
import { formatGBP } from "@/lib/currency";
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
  const averageBasket = orders.length
    ? orders.reduce((sum, order) => sum + order.total, 0) / orders.length
    : 0;
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
          <div className="flex flex-wrap items-center justify-between gap-3">
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
            value={formatGBP(averageBasket)}
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

        <div className="mt-5 space-y-3 sm:hidden">
          {orders.length ? (
            orders.map((order) => (
              <article
                key={order.order_id}
                className="rounded-[20px] border border-[#ddceb5] bg-[#fffdf7] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#8a7762]">
                      Order ID
                    </p>
                    <p className="mt-1 truncate text-base font-semibold text-[#463627]">
                      {order.order_id}
                    </p>
                  </div>
                  <span className="rounded-full bg-[#eef2df] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.08em] text-[#6b8440]">
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
                    <p className="mt-1 text-[#4a3a2b]">{order.items_count}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs uppercase tracking-[0.12em] text-[#8a7762]">
                      Total
                    </p>
                    <p className="mt-1 text-base font-semibold text-[#463627]">
                      £{(order.total_amount)}
                    </p>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-[20px] border border-dashed border-[#dccaad] bg-[#fffdf8] px-4 py-8 text-center">
              <h2 className="text-xl font-semibold text-[#463627]">
                No orders yet
              </h2>
              <p className="mt-2 text-sm text-[#7c6956]">
                Your mobile order history will appear here once orders are available.
              </p>
            </div>
          )}
        </div>

        <div className="mt-5 hidden sm:block">
          {orders.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-[#eadcc7] text-left text-[11px] uppercase tracking-[0.14em] text-[#8a7762]">
                    {["Order ID", "Date", "Items", "Products", "Total", "Status"].map(
                      (heading) => (
                        <th key={heading} className="px-4 py-3 font-medium first:pl-0">
                          {heading}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr
                      key={order.order_id}
                      className="border-b border-[#f0e5d3] align-top text-[#4a3a2b]"
                    >
                      <td className="px-4 py-4 font-medium first:pl-0">
                        {order.order_id}
                      </td>
                      <td className="px-4 py-4 text-[#7a6855]">{order.date}</td>
                      <td className="px-4 py-4">{order.items_count}</td>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          {order.products.length ? (
                            order.products.slice(0, 2).map((product, index) => (
                              <p key={`${product.product_id}-${product.variation_id}-${index}`}>
                                {product.product_name}
                                {product.variation_name
                                  ? ` (${product.variation_name})`
                                  : ""}
                              </p>
                            ))
                          ) : (
                            <p className="text-[#7a6855]">No products listed</p>
                          )}
                          {order.products.length > 2 ? (
                            <p className="text-xs text-[#7a6855]">
                              +{order.products.length - 2} more item(s)
                            </p>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-4 font-medium">
                        {formatGBP(order.total)}
                      </td>
                      <td className="px-4 py-4">
                        <span className="rounded-full bg-[#eef2df] px-3 py-1 text-xs font-medium text-[#6b8440]">
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-[22px] border border-dashed border-[#dccaad] bg-[#fffdf8] px-6 py-10 text-center">
              <h2 className="text-[1.45rem] font-semibold text-[#463627]">
                No orders yet
              </h2>
              <p className="mt-2 text-sm text-[#7c6956]">
                Your order history will appear here once orders are available.
              </p>
            </div>
          )}
        </div>
      </DashboardPanel>

      <div className="flex flex-col gap-3 px-1 text-sm text-[#7b6956] sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <p>
          Page {orderHistoryQuery.data?.page || page} of {totalPages}
        </p>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
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
