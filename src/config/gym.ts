/** Central configuration for Jupiter Gym. Edit these values to match your gym. */
export const GYM = {
  name: "Jupiter Gym",
  currency: "₹",
  /** Used in the WhatsApp click-to-chat message signature. */
  contactNumber: "+910000000000",
  /** Default country code prefixed to member mobile numbers for WhatsApp links. */
  countryCode: "91",
};

export type PlanKey = "monthly" | "quarterly" | "half_yearly" | "yearly";

export const PLANS: Record<PlanKey, { label: string; months: number; price: number }> = {
  monthly: { label: "Monthly", months: 1, price: 1000 },
  quarterly: { label: "Quarterly", months: 3, price: 2700 },
  half_yearly: { label: "Half Yearly", months: 6, price: 5000 },
  yearly: { label: "Yearly", months: 12, price: 9000 },
};

export const PLAN_KEYS = Object.keys(PLANS) as PlanKey[];

export const planLabel = (plan: string) => PLANS[plan as PlanKey]?.label ?? plan;
