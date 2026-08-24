import { createFileRoute, Link } from "@tanstack/react-router";
import dayjs from "dayjs";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AdminShell, btn } from "@/components/AdminShell";
import { EmptyState, ErrorState, LoadingState } from "@/components/EmptyState";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { useAttendance, useMembers, usePayments } from "@/hooks/useGymData";
import {
  formatMoney,
  formatTime,
  memberStatus,
  reminderMessage,
  whatsappLink,
} from "@/utils/format";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Jupiter Gym" },
      {
        name: "description",
        content:
          "Live Jupiter Gym metrics: members, today's attendance, expiring memberships and monthly revenue.",
      },
      { property: "og:title", content: "Dashboard — Jupiter Gym" },
      { property: "og:description", content: "Operations overview for Jupiter Gym staff." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const members = useMembers();
  const attendance = useAttendance();
  const payments = usePayments();

  if (members.isLoading || attendance.isLoading || payments.isLoading) {
    return (
      <AdminShell title="Operations Console">
        <LoadingState label="Loading gym metrics" />
      </AdminShell>
    );
  }

  const error = members.error || attendance.error || payments.error;
  if (error) {
    return (
      <AdminShell title="Operations Console">
        <ErrorState message={error.message} />
      </AdminShell>
    );
  }

  const memberList = members.data ?? [];
  const attendanceList = attendance.data ?? [];
  const paymentList = payments.data ?? [];
  const today = dayjs().format("YYYY-MM-DD");
  const monthStart = dayjs().startOf("month");

  const todayCheckIns = attendanceList.filter((row) => row.check_in_date === today);
  const active = memberList.filter((m) => memberStatus(m.expiry_date) === "active");
  const expiring = memberList.filter((m) => memberStatus(m.expiry_date) === "expiring");
  const expired = memberList.filter((m) => memberStatus(m.expiry_date) === "expired");
  const pendingDues = memberList.filter((m) => m.payment_status !== "paid");
  const monthRevenue = paymentList
    .filter((p) => p.status === "paid" && dayjs(p.paid_on).isAfter(monthStart.subtract(1, "day")))
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const trend = Array.from({ length: 14 }, (_, i) => {
    const day = dayjs().subtract(13 - i, "day");
    const key = day.format("YYYY-MM-DD");
    return {
      day: day.format("DD MMM"),
      checkIns: attendanceList.filter((row) => row.check_in_date === key).length,
    };
  });

  const revenueTrend = Array.from({ length: 6 }, (_, i) => {
    const month = dayjs().subtract(5 - i, "month");
    return {
      month: month.format("MMM"),
      revenue: paymentList
        .filter((p) => p.status === "paid" && dayjs(p.paid_on).isSame(month, "month"))
        .reduce((sum, p) => sum + Number(p.amount), 0),
    };
  });

  return (
    <AdminShell
      title="Operations Console"
      subtitle={dayjs().format("dddd, DD MMMM YYYY")}
      actions={
        <Link to="/members" className={btn}>
          Manage members
        </Link>
      }
    >
      <div className="animate-slide grid grid-cols-2 gap-px border border-border bg-border lg:grid-cols-5">
        <StatCard
          label="Total members"
          value={memberList.length}
          hint={`${active.length} active`}
        />
        <StatCard
          label="Today's attendance"
          value={todayCheckIns.length}
          tone="primary"
          hint={`${memberList.length ? Math.round((todayCheckIns.length / memberList.length) * 100) : 0}% of base`}
        />
        <StatCard label="Expiring in 7 days" value={expiring.length} tone="warning" />
        <StatCard label="Expired" value={expired.length} tone="destructive" />
        <StatCard
          label="Revenue this month"
          value={formatMoney(monthRevenue)}
          hint={`${pendingDues.length} pending payments`}
        />
      </div>

      <div className="animate-slide grid gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-end justify-between border-b border-border pb-2">
            <h2 className="heading-display text-lg">Attendance trend</h2>
            <span className="label-mono">Last 14 days</span>
          </div>
          <div className="h-56 border border-border p-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend}>
                <CartesianGrid
                  strokeDasharray="2 4"
                  stroke="var(--color-border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                  stroke="var(--color-border)"
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                  stroke="var(--color-border)"
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="checkIns" fill="var(--color-primary)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-end justify-between border-b border-border pb-2">
            <h2 className="heading-display text-lg">Revenue trend</h2>
            <span className="label-mono">Last 6 months</span>
          </div>
          <div className="h-48 border border-border p-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueTrend}>
                <CartesianGrid
                  strokeDasharray="2 4"
                  stroke="var(--color-border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                  stroke="var(--color-border)"
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                  stroke="var(--color-border)"
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="heading-display text-lg">Live feed</h2>
          {todayCheckIns.length === 0 ? (
            <EmptyState title="No check-ins yet" hint="Attendance appears here as members scan." />
          ) : (
            <div className="space-y-2">
              {todayCheckIns.slice(0, 8).map((row, index) => (
                <div
                  key={row.id}
                  className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-l-2 bg-muted/50 p-3 ${
                    index === 0 ? "border-primary" : "border-border opacity-70"
                  }`}
                >
                  <span className="truncate text-xs font-semibold">
                    {row.members?.name ?? "Member"}
                  </span>
                  <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                    {formatTime(row.check_in_at)}
                  </span>
                </div>
              ))}
            </div>
          )}

          <h2 className="heading-display pt-4 text-lg">Needs a reminder</h2>
          {expiring.length + expired.length === 0 ? (
            <EmptyState title="All memberships healthy" />
          ) : (
            <div className="space-y-2">
              {[...expired, ...expiring].slice(0, 6).map((m) => (
                <div key={m.id} className="space-y-2 border border-border p-3">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                    <span className="truncate text-xs font-semibold">{m.name}</span>
                    <StatusBadge
                      tone={memberStatus(m.expiry_date) === "expired" ? "destructive" : "warning"}
                    >
                      {memberStatus(m.expiry_date)}
                    </StatusBadge>
                  </div>
                  <a
                    href={whatsappLink(
                      m.mobile,
                      reminderMessage(m.name, m.expiry_date, m.plan_price),
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="block w-full bg-primary py-2 text-center font-display text-[10px] uppercase tracking-widest text-primary-foreground"
                  >
                    Send WhatsApp reminder
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
