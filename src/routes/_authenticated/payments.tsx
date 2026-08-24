import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import dayjs from "dayjs";
import { CheckCircle2, Download, MessageCircle, Plus, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";

import { AdminShell, btn, btnPrimary } from "@/components/AdminShell";
import { EmptyState, ErrorState, LoadingState } from "@/components/EmptyState";
import { StatCard } from "@/components/StatCard";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import { useMembers, usePayments } from "@/hooks/useGymData";
import { insertPayment } from "@/services/gym";
import { updatePaymentStatus } from "@/lib/dashboard.functions";
import { exportToExcel } from "@/utils/excel";
import {
  formatDate,
  formatMoney,
  memberStatus,
  reminderMessage,
  whatsappLink,
} from "@/utils/format";
import { paymentFormSchema, type PaymentFormInput } from "@/utils/validation";

export const Route = createFileRoute("/_authenticated/payments")({
  head: () => ({
    meta: [
      { title: "Payments — Jupiter Gym" },
      {
        name: "description",
        content:
          "Record Jupiter Gym membership payments, chase pending dues over WhatsApp and export revenue to Excel.",
      },
      { property: "og:title", content: "Payments — Jupiter Gym" },
      { property: "og:description", content: "Revenue and dues tracking for Jupiter Gym staff." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PaymentsPage,
});

const field =
  "w-full border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary";

function PaymentsPage() {
  const payments = usePayments();
  const members = useMembers();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const rows = payments.data ?? [];
  const memberList = members.data ?? [];
  const monthStart = dayjs().startOf("month");

  const totals = useMemo(() => {
    const paid = rows.filter((p) => p.status === "paid");
    return {
      month: paid
        .filter((p) => dayjs(p.paid_on).isSame(monthStart, "month"))
        .reduce((s, p) => s + Number(p.amount), 0),
      lifetime: paid.reduce((s, p) => s + Number(p.amount), 0),
      pending: rows.filter((p) => p.status !== "paid").reduce((s, p) => s + Number(p.amount), 0),
    };
  }, [rows, monthStart]);

  const dues = memberList.filter((m) => m.payment_status !== "paid");

  async function handleMarkPaid(paymentId: string, memberId: string) {
    setMarkingId(paymentId);
    try {
      await updatePaymentStatus({ data: { paymentId, status: "paid", memberId } });
      await queryClient.invalidateQueries({ queryKey: ["payments"] });
      await queryClient.invalidateQueries({ queryKey: ["members"] });
      toast.success("Payment marked as paid.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update status.");
    } finally {
      setMarkingId(null);
    }
  }

  async function handleMarkDuesPaid(memberId: string) {
    try {
      await updatePaymentStatus({ data: { paymentId: "", status: "paid", memberId } });
      await queryClient.invalidateQueries({ queryKey: ["members"] });
      await queryClient.invalidateQueries({ queryKey: ["payments"] });
      toast.success("Member marked as paid.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update status.");
    }
  }

  function exportPayments() {
    try {
      exportToExcel(
        rows.map((p) => ({
          Date: p.paid_on,
          Member: p.members?.name ?? "",
          "Member ID": p.members?.member_code ?? "",
          Amount: Number(p.amount),
          Method: p.method,
          Status: p.status,
          Note: p.note ?? "",
        })),
        "jupiter-gym-payments",
        "Payments",
      );
      toast.success("Excel file downloaded.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed.");
    }
  }

  return (
    <AdminShell
      title="Payments & Revenue"
      subtitle={`${rows.length} transactions recorded`}
      actions={
        <>
          <button type="button" onClick={exportPayments} className={btn}>
            <Download className="size-3" /> Excel
          </button>
          <button type="button" onClick={() => setOpen(true)} className={btnPrimary}>
            <Plus className="size-4" /> Record payment
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-px border border-border bg-border sm:grid-cols-3">
        <StatCard label="This month" value={formatMoney(totals.month)} tone="primary" />
        <StatCard label="Lifetime collected" value={formatMoney(totals.lifetime)} />
        <StatCard
          label="Outstanding"
          value={formatMoney(totals.pending)}
          tone="warning"
          hint={`${dues.length} members with dues`}
        />
      </div>

      {dues.length > 0 ? (
        <div className="animate-slide space-y-3">
          <h2 className="heading-display border-b border-border pb-2 text-lg">Chase dues</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {dues.map((m) => (
              <div key={m.id} className="space-y-3 border border-border p-4">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{m.name}</div>
                    <div className="font-mono text-[10px] text-muted-foreground">
                      {formatMoney(m.plan_price)} · {m.mobile}
                    </div>
                  </div>
                  <StatusBadge tone={m.payment_status === "overdue" ? "destructive" : "warning"}>
                    {m.payment_status}
                  </StatusBadge>
                </div>
                <div className="flex gap-2">
                  <a
                    href={whatsappLink(
                      m.mobile,
                      reminderMessage(m.name, m.expiry_date, m.plan_price),
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className={`${btn} flex-1 justify-center`}
                  >
                    <MessageCircle className="size-3" /> Chase
                  </a>
                  <button
                    type="button"
                    onClick={() => handleMarkDuesPaid(m.id)}
                    className={`${btn} flex-1 justify-center`}
                  >
                    <CheckCircle2 className="size-3" /> Mark paid
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <h2 className="heading-display border-b border-border pb-2 text-lg">Transaction history</h2>
      {payments.isLoading ? (
        <LoadingState label="Loading payments" />
      ) : payments.error ? (
        <ErrorState message={payments.error.message} />
      ) : rows.length === 0 ? (
        <EmptyState title="No payments yet" hint="Record your first transaction." />
      ) : (
        <div className="animate-slide w-full overflow-x-auto border border-border">
          <table className="w-full min-w-[800px] border-collapse text-left">
            <thead className="bg-muted/60 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
              <tr>
                <th className="border-b border-border p-4">Member</th>
                <th className="border-b border-border p-4">Amount</th>
                <th className="border-b border-border p-4">Method</th>
                <th className="border-b border-border p-4">Status</th>
                <th className="border-b border-border p-4">Date</th>
                <th className="border-b border-border p-4">Note</th>
                <th className="border-b border-border p-4">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {rows.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-border transition-colors hover:bg-accent/40"
                >
                  <td className="p-4">
                    <div className="font-semibold">{p.members?.name ?? "Member"}</div>
                    <div className="font-mono text-[10px] text-muted-foreground">
                      {p.members?.member_code ?? "—"}
                    </div>
                  </td>
                  <td className="p-4 font-mono text-sm text-primary">{formatMoney(p.amount)}</td>
                  <td className="p-4 font-mono text-[10px] uppercase">{p.method}</td>
                  <td className="p-4">
                    <StatusBadge tone={statusTone(p.status)}>{p.status}</StatusBadge>
                  </td>
                  <td className="p-4 font-mono text-xs">{formatDate(p.paid_on)}</td>
                  <td className="p-4 text-xs text-muted-foreground">{p.note ?? "—"}</td>
                  <td className="p-4">
                    {p.status !== "paid" ? (
                      <button
                        type="button"
                        disabled={markingId === p.id}
                        onClick={() => handleMarkPaid(p.id, p.member_id)}
                        className="inline-flex items-center gap-1 border border-primary px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-primary transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
                      >
                        <CheckCircle2 className="size-3" />
                        {markingId === p.id ? "Saving…" : "Mark paid"}
                      </button>
                    ) : (
                      <span className="font-mono text-[10px] text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open ? <PaymentDialog onClose={() => setOpen(false)} /> : null}
    </AdminShell>
  );
}

function PaymentDialog({ onClose }: { onClose: () => void }) {
  const { data } = useMembers();
  const queryClient = useQueryClient();
  const memberList = data ?? [];
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PaymentFormInput>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: { member_id: "", amount: "", method: "cash", status: "paid", note: "" },
  });

  const memberId = watch("member_id");

  const submit = handleSubmit(async (values) => {
    try {
      await insertPayment({
        member_id: values.member_id,
        amount: Number(values.amount),
        method: values.method,
        status: values.status,
        note: values.note || null,
      });
      await updatePaymentStatus({
        data: { paymentId: "", status: values.status, memberId: values.member_id },
      });
      await queryClient.invalidateQueries({ queryKey: ["payments"] });
      await queryClient.invalidateQueries({ queryKey: ["members"] });
      toast.success("Payment recorded.");
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not record payment.");
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-background/80 p-4 backdrop-blur-sm">
      <form
        onSubmit={submit}
        className="animate-stamp my-8 w-full max-w-md space-y-4 border border-border bg-card p-6"
      >
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-border pb-3">
          <h2 className="heading-display truncate text-xl">Record payment</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="shrink-0 p-1">
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-2">
          <label className="label-mono block">Member</label>
          <select
            value={memberId}
            onChange={(e) => {
              const id = e.target.value;
              setValue("member_id", id);
              const found = memberList.find((m) => m.id === id);
              if (found) setValue("amount", String(found.plan_price));
            }}
            className={field}
          >
            <option value="">Select a member</option>
            {memberList.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} · {m.mobile}
              </option>
            ))}
          </select>
          {errors.member_id ? (
            <p className="text-xs text-destructive">{errors.member_id.message}</p>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="label-mono block">Amount</label>
            <input {...register("amount")} inputMode="decimal" className={field} />
            {errors.amount ? (
              <p className="text-xs text-destructive">{errors.amount.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <label className="label-mono block">Method</label>
            <select {...register("method")} className={field}>
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="card">Card</option>
              <option value="bank">Bank transfer</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="label-mono block">Status</label>
            <select {...register("status")} className={field}>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="label-mono block">Note</label>
            <input {...register("note")} className={field} placeholder="Optional" />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-border pt-4">
          <button type="submit" disabled={isSubmitting} className={btnPrimary}>
            {isSubmitting ? "Saving…" : "Save payment"}
          </button>
          <button type="button" onClick={onClose} className={btn}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
