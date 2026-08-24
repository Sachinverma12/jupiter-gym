import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import dayjs from "dayjs";
import { Download, MessageCircle, Pencil, Plus, RefreshCw, Search, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";

import { AdminShell, btn, btnPrimary } from "@/components/AdminShell";
import { EmptyState, ErrorState, LoadingState } from "@/components/EmptyState";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import { PLAN_KEYS, PLANS, planLabel } from "@/config/gym";
import { useMembers } from "@/hooks/useGymData";
import {
  deleteMemberServer,
  insertMemberServer,
  insertPaymentServer,
  nextMemberCodeServer,
  updateMemberServer,
} from "@/lib/dashboard.functions";
import type { Member } from "@/lib/dashboard.functions";
import { exportToExcel } from "@/utils/excel";
import {
  formatDate,
  formatMoney,
  memberStatus,
  reminderMessage,
  whatsappLink,
} from "@/utils/format";
import { memberFormSchema, toNumber, type MemberFormInput } from "@/utils/validation";

export const Route = createFileRoute("/_authenticated/members")({
  head: () => ({
    meta: [
      { title: "Members — Jupiter Gym" },
      {
        name: "description",
        content:
          "Add, edit, renew and search Jupiter Gym memberships. Track active, expiring and expired members.",
      },
      { property: "og:title", content: "Members — Jupiter Gym" },
      { property: "og:description", content: "Membership management for Jupiter Gym staff." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MembersPage,
});

const field =
  "w-full border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary";

type Filter = "all" | "active" | "expiring" | "expired";

function MembersPage() {
  const { data, isLoading, error } = useMembers();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [editing, setEditing] = useState<Member | null>(null);
  const [creating, setCreating] = useState(false);

  const members = data ?? [];
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return members.filter((m) => {
      const matchesSearch =
        !term ||
        m.name.toLowerCase().includes(term) ||
        m.mobile.includes(term) ||
        m.member_code.toLowerCase().includes(term);
      const matchesFilter = filter === "all" || memberStatus(m.expiry_date) === filter;
      return matchesSearch && matchesFilter;
    });
  }, [members, search, filter]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["members"] });

  async function renew(member: Member) {
    const plan = PLANS[member.plan as keyof typeof PLANS] ?? PLANS.monthly;
    const base = dayjs(member.expiry_date).isBefore(dayjs()) ? dayjs() : dayjs(member.expiry_date);
    try {
      await updateMemberServer({
        data: {
          id: member.id,
          values: {
            expiry_date: base.add(plan.months, "month").format("YYYY-MM-DD"),
            payment_status: "paid",
          },
        },
      });
      await insertPaymentServer({
        data: {
          member_id: member.id,
          amount: Number(member.plan_price),
          method: "cash",
          status: "paid",
          note: `${plan.label} renewal`,
        },
      });
      await refresh();
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      toast.success(`${member.name}'s membership renewed.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Renewal failed.");
    }
  }

  async function remove(member: Member) {
    if (!window.confirm(`Delete ${member.name}? This also removes their attendance history.`))
      return;
    try {
      await deleteMemberServer({ data: { id: member.id } });
      await refresh();
      toast.success("Member deleted.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed.");
    }
  }

  function exportMembers() {
    try {
      exportToExcel(
        filtered.map((m) => ({
          "Member ID": m.member_code,
          Name: m.name,
          Mobile: m.mobile,
          Age: m.age ?? "",
          Gender: m.gender ?? "",
          Plan: planLabel(m.plan),
          Fee: Number(m.plan_price),
          "Join date": m.join_date,
          "Expiry date": m.expiry_date,
          Status: memberStatus(m.expiry_date),
          Payment: m.payment_status,
        })),
        "jupiter-gym-members",
        "Members",
      );
      toast.success("Excel file downloaded.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed.");
    }
  }

  return (
    <AdminShell
      title="Member Management"
      subtitle={`${members.length} total · ${members.filter((m) => memberStatus(m.expiry_date) === "expiring").length} expiring soon`}
      actions={
        <>
          <button type="button" onClick={exportMembers} className={btn}>
            <Download className="size-3" /> Excel
          </button>
          <button type="button" onClick={() => setCreating(true)} className={btnPrimary}>
            <Plus className="size-4" /> Add member
          </button>
        </>
      }
    >
      <div className="grid gap-3 sm:flex sm:items-center sm:justify-between">
        <div className="relative">
          <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, mobile or ID"
            className={`${field} pl-9 sm:w-80`}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["all", "active", "expiring", "expired"] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={
                filter === f
                  ? "bg-primary px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-primary-foreground"
                  : "border border-border px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:border-primary hover:text-primary"
              }
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <LoadingState label="Loading members" />
      ) : error ? (
        <ErrorState message={error.message} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No members found"
          hint={
            members.length
              ? "Try a different search or filter."
              : "Add your first member to get started."
          }
        />
      ) : (
        <div className="animate-slide w-full overflow-x-auto border border-border">
          <table className="w-full min-w-[880px] border-collapse text-left">
            <thead className="bg-muted/60 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
              <tr>
                <th className="border-b border-border p-4">Member</th>
                <th className="border-b border-border p-4">Plan</th>
                <th className="border-b border-border p-4">Status</th>
                <th className="border-b border-border p-4">Expires</th>
                <th className="border-b border-border p-4">Payment</th>
                <th className="border-b border-border p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filtered.map((m) => {
                const status = memberStatus(m.expiry_date);
                return (
                  <tr
                    key={m.id}
                    className="border-b border-border transition-colors hover:bg-accent/40"
                  >
                    <td className="p-4">
                      <div className="font-semibold">{m.name}</div>
                      <div className="font-mono text-[10px] text-muted-foreground">
                        {m.member_code} · {m.mobile}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-xs uppercase">{planLabel(m.plan)}</div>
                      <div className="font-mono text-[10px] text-muted-foreground">
                        {formatMoney(m.plan_price)}
                      </div>
                    </td>
                    <td className="p-4">
                      <StatusBadge tone={statusTone(status)}>{status}</StatusBadge>
                    </td>
                    <td className="p-4 font-mono text-xs">{formatDate(m.expiry_date)}</td>
                    <td className="p-4">
                      <StatusBadge tone={statusTone(m.payment_status)}>
                        {m.payment_status}
                      </StatusBadge>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap justify-end gap-2">
                        <a
                          href={whatsappLink(
                            m.mobile,
                            reminderMessage(m.name, m.expiry_date, m.plan_price),
                          )}
                          target="_blank"
                          rel="noreferrer"
                          title="Send WhatsApp reminder"
                          className="p-2 text-muted-foreground transition-colors hover:text-primary"
                        >
                          <MessageCircle className="size-4" />
                        </a>
                        <button
                          type="button"
                          onClick={() => renew(m)}
                          title="Renew membership"
                          className="p-2 text-muted-foreground transition-colors hover:text-primary"
                        >
                          <RefreshCw className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditing(m)}
                          title="Edit member"
                          className="p-2 text-muted-foreground transition-colors hover:text-foreground"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(m)}
                          title="Delete member"
                          className="p-2 text-muted-foreground transition-colors hover:text-destructive"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {creating || editing ? (
        <MemberDialog
          member={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={async () => {
            setCreating(false);
            setEditing(null);
            await refresh();
          }}
        />
      ) : null}
    </AdminShell>
  );
}

function MemberDialog({
  member,
  onClose,
  onSaved,
}: {
  member: Member | null;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<MemberFormInput>({
    resolver: zodResolver(memberFormSchema),
    defaultValues: member
      ? {
          name: member.name,
          mobile: member.mobile,
          age: member.age ? String(member.age) : "",
          gender: (member.gender as "male" | "female" | "other" | null) ?? "",
          plan: member.plan as MemberFormInput["plan"],
          plan_price: String(member.plan_price),
          payment_status: member.payment_status,
          expiry_date: member.expiry_date,
          notes: member.notes ?? "",
        }
      : {
          name: "",
          mobile: "",
          age: "",
          gender: "",
          plan: "monthly",
          plan_price: String(PLANS.monthly.price),
          payment_status: "pending",
          expiry_date: dayjs().add(1, "month").format("YYYY-MM-DD"),
          notes: "",
        },
  });

  const plan = watch("plan");

  function applyPlan(next: MemberFormInput["plan"]) {
    setValue("plan", next);
    setValue("plan_price", String(PLANS[next].price));
    setValue("expiry_date", dayjs().add(PLANS[next].months, "month").format("YYYY-MM-DD"));
  }

  const submit = handleSubmit(async (values) => {
    const payload = {
      name: values.name,
      mobile: values.mobile.replace(/\D/g, "").slice(-10),
      age: toNumber(values.age) ?? null,
      gender: values.gender || null,
      plan: values.plan,
      plan_price: Number(values.plan_price),
      payment_status: values.payment_status,
      expiry_date: values.expiry_date,
      notes: values.notes || null,
    };
    try {
      if (member) {
        await updateMemberServer({ data: { id: member.id, values: payload } });
        toast.success("Member updated.");
      } else {
        const code = await nextMemberCodeServer();
        await insertMemberServer({ data: { ...payload, member_code: code } });
        toast.success("Member added.");
      }
      await onSaved();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Save failed.";
      toast.error(message.includes("duplicate") ? "That mobile number already exists." : message);
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-background/80 p-4 backdrop-blur-sm">
      <form
        onSubmit={submit}
        className="animate-stamp my-8 w-full max-w-lg space-y-4 border border-border bg-card p-6"
      >
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-border pb-3">
          <h2 className="heading-display truncate text-xl">
            {member ? "Edit member" : "Add member"}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="shrink-0 p-1">
            <X className="size-4" />
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <label className="label-mono block">Full name</label>
            <input {...register("name")} className={field} />
            {errors.name ? <p className="text-xs text-destructive">{errors.name.message}</p> : null}
          </div>
          <div className="space-y-2">
            <label className="label-mono block">Mobile</label>
            <input {...register("mobile")} inputMode="numeric" className={field} />
            {errors.mobile ? (
              <p className="text-xs text-destructive">{errors.mobile.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <label className="label-mono block">Age</label>
            <input {...register("age")} inputMode="numeric" className={field} />
            {errors.age ? <p className="text-xs text-destructive">{errors.age.message}</p> : null}
          </div>
          <div className="space-y-2">
            <label className="label-mono block">Gender</label>
            <select {...register("gender")} className={field}>
              <option value="">—</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="label-mono block">Plan</label>
            <select
              value={plan}
              onChange={(e) => applyPlan(e.target.value as MemberFormInput["plan"])}
              className={field}
            >
              {PLAN_KEYS.map((key) => (
                <option key={key} value={key}>
                  {PLANS[key].label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="label-mono block">Fee</label>
            <input {...register("plan_price")} inputMode="decimal" className={field} />
            {errors.plan_price ? (
              <p className="text-xs text-destructive">{errors.plan_price.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <label className="label-mono block">Expiry date</label>
            <input type="date" {...register("expiry_date")} className={field} />
            {errors.expiry_date ? (
              <p className="text-xs text-destructive">{errors.expiry_date.message}</p>
            ) : null}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className="label-mono block">Payment status</label>
            <select {...register("payment_status")} className={field}>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className="label-mono block">Notes</label>
            <textarea {...register("notes")} rows={2} className={field} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-border pt-4">
          <button type="submit" disabled={isSubmitting} className={btnPrimary}>
            {isSubmitting ? "Saving…" : member ? "Save changes" : "Add member"}
          </button>
          <button type="button" onClick={onClose} className={btn}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
