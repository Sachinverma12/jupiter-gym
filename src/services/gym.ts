import { supabase } from "@/integrations/supabase/client";

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

function unwrap<T>({ data, error }: { data: T | null; error: { message: string } | null }): T {
  if (error) throw new Error(error.message);
  return (data ?? []) as T;
}

export const fetchMembers = async () =>
  unwrap<Member[]>(
    await supabase.from("members").select("*").order("created_at", { ascending: false }),
  );

export const fetchAttendance = async (limit = 400) =>
  unwrap<AttendanceRow[]>(
    await supabase
      .from("attendance")
      .select("id, member_id, check_in_date, check_in_at, members(name, member_code, mobile)")
      .order("check_in_at", { ascending: false })
      .limit(limit),
  );

export const fetchPayments = async () =>
  unwrap<Payment[]>(
    await supabase
      .from("payments")
      .select(
        "id, member_id, amount, paid_on, method, status, note, members(name, member_code, mobile)",
      )
      .order("paid_on", { ascending: false }),
  );

export const insertMember = async (values: Partial<Member>) => {
  const { error } = await supabase.from("members").insert(values as never);
  if (error) throw new Error(error.message);
};

export const updateMember = async (id: string, values: Partial<Member>) => {
  const { error } = await supabase
    .from("members")
    .update(values as never)
    .eq("id", id);
  if (error) throw new Error(error.message);
};

export const deleteMember = async (id: string) => {
  const { error } = await supabase.from("members").delete().eq("id", id);
  if (error) throw new Error(error.message);
};

export const insertPayment = async (values: {
  member_id: string;
  amount: number;
  method: string;
  status: "paid" | "pending" | "overdue";
  note?: string | null;
}) => {
  const { error } = await supabase.from("payments").insert(values as never);
  if (error) throw new Error(error.message);
};

export const nextMemberCode = async () => {
  const { data } = await supabase
    .from("members")
    .select("member_code")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const last = Number(data?.member_code?.replace(/\D/g, "") ?? 1000);
  return `JG-${Number.isNaN(last) ? 1001 : last + 1}`;
};
