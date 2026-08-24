import dayjs from "dayjs";

import { GYM } from "@/config/gym";

export type MemberStatus = "active" | "expiring" | "expired";

export function memberStatus(expiry: string): MemberStatus {
  const days = dayjs(expiry).startOf("day").diff(dayjs().startOf("day"), "day");
  if (days < 0) return "expired";
  if (days <= 7) return "expiring";
  return "active";
}

export function daysLeft(expiry: string) {
  return dayjs(expiry).startOf("day").diff(dayjs().startOf("day"), "day");
}

export const formatDate = (value?: string | null) =>
  value ? dayjs(value).format("DD MMM YYYY") : "—";

export const formatTime = (value?: string | null) => (value ? dayjs(value).format("hh:mm A") : "—");

export const formatMoney = (amount: number | string) =>
  `${GYM.currency}${Number(amount).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

/** Digits-only phone with country code, ready for wa.me links. */
export function waNumber(mobile: string) {
  const digits = mobile.replace(/\D/g, "");
  if (digits.length > 10) return digits;
  return `${GYM.countryCode}${digits}`;
}

export function whatsappLink(mobile: string, message: string) {
  return `https://wa.me/${waNumber(mobile)}?text=${encodeURIComponent(message)}`;
}

export function reminderMessage(name: string, expiry: string, amount?: number | string) {
  const status = memberStatus(expiry);
  const due = amount ? ` Amount due: ${formatMoney(amount)}.` : "";
  if (status === "expired") {
    return `Hi ${name}, your ${GYM.name} membership expired on ${formatDate(expiry)}.${due} Please renew to continue training with us. — ${GYM.name}`;
  }
  return `Hi ${name}, your ${GYM.name} membership expires on ${formatDate(expiry)} (${daysLeft(expiry)} days left).${due} Renew now to keep your streak going. — ${GYM.name}`;
}
