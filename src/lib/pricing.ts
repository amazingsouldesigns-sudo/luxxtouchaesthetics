import { services, getServiceById } from "@/lib/services";
import { VIP_FEE } from "@/lib/booking-store";

export const DEPOSIT_PCT = 0.35;
export { VIP_FEE };

export type PriceBreakdown = {
  serviceTotal: number;
  addOnsTotal: number;
  vipFee: number;
  total: number;
  deposit: number;
  remaining: number;
};

export function computePricing(
  serviceId: string,
  addOnIds: string[] = [],
  vip = false,
): PriceBreakdown {
  const svc = getServiceById(serviceId);
  const serviceTotal = svc?.price ?? 0;
  const addOns = addOnIds
    .map((id) => services.find((s) => s.id === id && s.category === "Add-ons"))
    .filter(Boolean) as { price: number }[];
  const addOnsTotal = addOns.reduce((s, a) => s + a.price, 0);
  const vipFee = vip ? VIP_FEE : 0;
  const total = serviceTotal + addOnsTotal + vipFee;
  const deposit = Math.round(total * DEPOSIT_PCT * 100) / 100;
  const remaining = Math.round((total - deposit) * 100) / 100;
  return { serviceTotal, addOnsTotal, vipFee, total, deposit, remaining };
}
