import { createServerFn } from "@tanstack/react-start";

export type Member = {
  id: string;
  member_code: string;
  name: string;
  mobile: string;
  age: number | null;
  gender: string | null;
  plan: string;
  plan_price: number;
  join_date: string;
  expiry_date: string;
  payment_status: "paid" | "pending" | "overdue";
  notes: string | null;
  created_at: string;
};

export type AttendanceRow = {
  id: string;
  member_id: string;
  check_in_date: string;
  check_in_at: string;
  members: { name: string; member_code: string; mobile: string } | null;
};

export type Payment = {
  id: string;
  member_id: string;
  amount: number;
  paid_on: string;
  method: string;
  status: "paid" | "pending" | "overdue";
  note: string | null;
  members: { name: string; member_code: string; mobile: string } | null;
};

export const fetchMembersServer = createServerFn({ method: "GET" })
  .handler(async (): Promise<Member[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("members")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as Member[];
  });

export const fetchAttendanceServer = createServerFn({ method: "GET" })
  .handler(async (): Promise<AttendanceRow[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("attendance")
      .select("id, member_id, check_in_date, check_in_at, members(name, member_code, mobile)")
      .order("check_in_at", { ascending: false })
      .limit(400);
    if (error) throw new Error(error.message);
    return (data ?? []) as AttendanceRow[];
  });

export const fetchPaymentsServer = createServerFn({ method: "GET" })
  .handler(async (): Promise<Payment[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("payments")
      .select(
        "id, member_id, amount, paid_on, method, status, note, members(name, member_code, mobile)",
      )
      .order("paid_on", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as Payment[];
  });

export const updatePaymentStatus = createServerFn({ method: "POST" })
  .validator((data: { paymentId: string; status: "paid" | "pending" | "overdue"; memberId: string }) => data)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (data.paymentId) {
      const { error: payErr } = await supabaseAdmin
        .from("payments")
        .update({ status: data.status })
        .eq("id", data.paymentId);
      if (payErr) throw new Error(payErr.message);
    }

    const { error: memErr } = await supabaseAdmin
      .from("members")
      .update({ payment_status: data.status })
      .eq("id", data.memberId);
    if (memErr) throw new Error(memErr.message);
  });
