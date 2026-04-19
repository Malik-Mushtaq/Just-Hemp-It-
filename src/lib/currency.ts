const gbpFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
});

export const toNumericAmount = (value: unknown) => {
  const parsed =
    typeof value === "number" ? value : Number.parseFloat(String(value ?? 0));

  return Number.isFinite(parsed) ? parsed : 0;
};

export const formatGBP = (value: number) =>
  gbpFormatter.format(Number.isFinite(value) ? value : 0);

export const formatGBPFromUnknown = (value: unknown) =>
  formatGBP(toNumericAmount(value));
