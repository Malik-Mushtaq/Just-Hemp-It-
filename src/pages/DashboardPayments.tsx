import { CreditCard, Plus } from "lucide-react";
import { DashboardHero, DashboardLayout, DashboardPanel } from "./Dashboard";
import { Button } from "@/components/ui/button";

const cards = [
  { type: "VISA", last4: "4242", exp: "02/27", isDefault: true },
  { type: "MC", last4: "8888", exp: "08/28", isDefault: false },
];

const DashboardPayments = () => (
  <DashboardLayout>
    <DashboardHero
      eyebrow="Payment"
      title="Payment Methods"
      description="Manage saved cards inside a cleaner, more premium-looking account flow."
    />

    <DashboardPanel>
      <div className="space-y-3">
        {cards.map((card) => (
          <div
            key={card.last4}
            className="flex flex-col items-stretch justify-between gap-3 rounded-[20px] border border-[#ddceb5] bg-[#fffdf7] px-4 py-4 sm:flex-row sm:flex-wrap sm:items-center"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-gradient-to-r from-[#6c5421] via-[#6d7f35] to-[#93ab3c] text-white">
                <CreditCard className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#453526]">
                  {card.type} ending in {card.last4}
                </p>
                <p className="mt-1 text-xs text-[#84735f]">Expires {card.exp}</p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 sm:justify-start">
              {card.isDefault ? (
                <span className="rounded-full bg-[#eef2df] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.08em] text-[#6b8440]">
                  Default
                </span>
              ) : null}
              <button className="text-xs font-medium text-[#ff3d37]">
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <Button
        variant="outline"
        className="mt-4 w-full rounded-full border-[#d8c8ac] bg-[#fffdf7] text-[#5a4a3a] sm:w-auto"
      >
        <Plus className="mr-2 h-4 w-4" />
        Add New Card
      </Button>
    </DashboardPanel>
  </DashboardLayout>
);

export default DashboardPayments;
