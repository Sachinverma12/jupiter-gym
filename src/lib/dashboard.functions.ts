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

export const insertMemberServer = createServerFn({ method: "POST" })
  .validator(
    (data: {
      member_code: string;
      name: string;
      mobile: string;
      age: number | null;
      gender: string | null;
      plan: string;
      plan_price: number;
      payment_status: "paid" | "pending" | "overdue";
      expiry_date: string;
      notes: string | null;
    }) => data,
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("members").insert(data);
    if (error) throw new Error(error.message);
  });

export const updateMemberServer = createServerFn({ method: "POST" })
  .validator(
    (data: {
      id: string;
      values: Partial<{
        name: string;
        mobile: string;
        age: number | null;
        gender: string | null;
        plan: string;
        plan_price: number;
        payment_status: "paid" | "pending" | "overdue";
        expiry_date: string;
        notes: string | null;
      }>;
    }) => data,
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("members").update(data.values).eq("id", data.id);
    if (error) throw new Error(error.message);
  });

export const deleteMemberServer = createServerFn({ method: "POST" })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("members").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
  });

export const nextMemberCodeServer = createServerFn({ method: "GET" })
  .handler(async (): Promise<string> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("members")
      .select("member_code")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const last = Number(data?.member_code?.replace(/\D/g, "") ?? 1000);
    return `JG-${Number.isNaN(last) ? 1001 : last + 1}`;
  });

export const insertPaymentServer = createServerFn({ method: "POST" })
  .validator(
    (data: {
      member_id: string;
      amount: number;
      method: string;
      status: "paid" | "pending" | "overdue";
      note?: string | null;
    }) => data,
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("payments").insert({
      member_id: data.member_id,
      amount: data.amount,
      method: data.method,
      status: data.status,
      note: data.note ?? null,
    });
    if (error) throw new Error(error.message);
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

export type MemberRequest = {
  id: string;
  name: string;
  mobile: string;
  age: number | null;
  gender: string | null;
  plan: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  reviewed_at: string | null;
};

export const fetchMemberRequestsServer = createServerFn({ method: "GET" })
  .handler(async (): Promise<MemberRequest[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("member_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as MemberRequest[];
  });

export const approveMemberRequestServer = createServerFn({ method: "POST" })
  .validator((data: { requestId: string }) => data)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: request, error: fetchErr } = await supabaseAdmin
      .from("member_requests")
      .select("*")
      .eq("id", data.requestId)
      .single();
    if (fetchErr || !request) throw new Error("Request not found.");
    if (request.status !== "pending") throw new Error("This request has already been processed.");

    const PLAN_MONTHS: Record<string, { months: number; price: number }> = {
      monthly: { months: 1, price: 1000 },
      quarterly: { months: 3, price: 2700 },
      half_yearly: { months: 6, price: 5000 },
      yearly: { months: 12, price: 9000 },
    };

    const plan = PLAN_MONTHS[request.plan] ?? PLAN_MONTHS["monthly"];
    const months = plan?.months ?? 1;
    const price = plan?.price ?? 1000;
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + months);
    const expiryDate = expiry.toISOString().slice(0, 10);

    let member: { id: string; name: string; member_code: string; expiry_date: string } | null = null;
    for (let attempt = 0; attempt < 5 && !member; attempt++) {
      const code = `JG-${Math.floor(1000 + Math.random() * 9000)}`;
      const { data: created, error } = await supabaseAdmin
        .from("members")
        .insert({
          member_code: code,
          name: request.name,
          mobile: request.mobile,
          age: request.age ?? null,
          gender: request.gender ?? null,
          plan: request.plan,
          plan_price: price,
          expiry_date: expiryDate,
          payment_status: "pending",
        })
        .select("id, name, member_code, expiry_date")
        .single();
      if (created) member = created;
      else if (error && !error.message.includes("member_code")) {
        throw new Error("Failed to create member. Please try again.");
      }
    }
    if (!member) throw new Error("Failed to create member. Please try again.");

    const { error: updateErr } = await supabaseAdmin
      .from("member_requests")
      .update({ status: "approved", reviewed_at: new Date().toISOString() })
      .eq("id", data.requestId);
    if (updateErr) throw new Error(updateErr.message);

    return member;
  });

export const rejectMemberRequestServer = createServerFn({ method: "POST" })
  .validator((data: { requestId: string }) => data)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin
      .from("member_requests")
      .update({ status: "rejected", reviewed_at: new Date().toISOString() })
      .eq("id", data.requestId);
    if (error) throw new Error(error.message);
  });
