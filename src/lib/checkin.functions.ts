import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Public server functions used by the static gym QR code.
 * Gym visitors never touch the database directly — these handlers run on the
 * server, validate input, and only return the minimum information needed to
 * confirm a check-in.
 */

const lookupSchema = z.object({ mobile: z.string().trim().min(6).max(20) });

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  mobile: z.string().trim().min(6).max(20),
  age: z.number().int().min(10).max(100).optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  plan: z.enum(["monthly", "quarterly", "half_yearly", "yearly"]),
});

const normalize = (mobile: string) => mobile.replace(/\D/g, "").slice(-10);

const PLAN_MONTHS: Record<string, { months: number; price: number }> = {
  monthly: { months: 1, price: 1000 },
  quarterly: { months: 3, price: 2700 },
  half_yearly: { months: 6, price: 5000 },
  yearly: { months: 12, price: 9000 },
};

export type CheckInResult =
  | { status: "unknown" }
  | {
      status: "checked_in" | "already" | "expired";
      name: string;
      memberCode: string;
      expiry: string;
      time: string;
    };

export const checkInByMobile = createServerFn({ method: "POST" })
  .validator((data) => lookupSchema.parse(data))
  .handler(async ({ data }): Promise<CheckInResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const mobile = normalize(data.mobile);

    const { data: member } = await supabaseAdmin
      .from("members")
      .select("id, name, member_code, expiry_date")
      .eq("mobile", mobile)
      .maybeSingle();

    if (!member) return { status: "unknown" };

    const base = {
      name: member.name,
      memberCode: member.member_code,
      expiry: member.expiry_date,
    };

    const today = new Date().toISOString().slice(0, 10);
    if (member.expiry_date < today) {
      return { ...base, status: "expired", time: new Date().toISOString() };
    }

    const { data: existing } = await supabaseAdmin
      .from("attendance")
      .select("check_in_at")
      .eq("member_id", member.id)
      .eq("check_in_date", today)
      .maybeSingle();

    if (existing) {
      return { ...base, status: "already", time: existing.check_in_at };
    }

    const { data: inserted, error } = await supabaseAdmin
      .from("attendance")
      .insert({ member_id: member.id, check_in_date: today })
      .select("check_in_at")
      .single();

    if (error) throw new Error("Could not record your check-in. Please try again.");

    return { ...base, status: "checked_in", time: inserted.check_in_at };
  });

export const registerMember = createServerFn({ method: "POST" })
  .validator((data) => registerSchema.parse(data))
  .handler(async ({ data }): Promise<CheckInResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const mobile = normalize(data.mobile);
    if (mobile.length < 10) throw new Error("Please enter a valid 10 digit mobile number.");

    const { data: existing } = await supabaseAdmin
      .from("members")
      .select("id")
      .eq("mobile", mobile)
      .maybeSingle();
    if (existing) throw new Error("This mobile number is already registered. Just check in.");

    const plan = PLAN_MONTHS[data.plan]!;
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + plan.months);
    const expiryDate = expiry.toISOString().slice(0, 10);

    let member: { id: string; name: string; member_code: string; expiry_date: string } | null =
      null;
    for (let attempt = 0; attempt < 5 && !member; attempt++) {
      const code = `JG-${Math.floor(1000 + Math.random() * 9000)}`;
      const { data: created, error } = await supabaseAdmin
        .from("members")
        .insert({
          member_code: code,
          name: data.name,
          mobile,
          age: data.age ?? null,
          gender: data.gender ?? null,
          plan: data.plan,
          plan_price: plan.price,
          expiry_date: expiryDate,
          payment_status: "pending",
        })
        .select("id, name, member_code, expiry_date")
        .single();
      if (created) member = created;
      else if (error && !error.message.includes("member_code")) {
        throw new Error("Registration failed. Please ask the gym staff for help.");
      }
    }
    if (!member) throw new Error("Registration failed. Please try again.");

    const { data: attendance } = await supabaseAdmin
      .from("attendance")
      .insert({ member_id: member.id })
      .select("check_in_at")
      .single();

    return {
      status: "checked_in",
      name: member.name,
      memberCode: member.member_code,
      expiry: member.expiry_date,
      time: attendance?.check_in_at ?? new Date().toISOString(),
    };
  });
