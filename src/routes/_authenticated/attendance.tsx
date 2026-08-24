import { createFileRoute } from "@tanstack/react-router";
import dayjs from "dayjs";
import { Download, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "react-toastify";

import { AdminShell, btn } from "@/components/AdminShell";
import { EmptyState, ErrorState, LoadingState } from "@/components/EmptyState";
import { StatCard } from "@/components/StatCard";
import { useAttendance } from "@/hooks/useGymData";
import { exportToExcel } from "@/utils/excel";
import { formatDate, formatTime } from "@/utils/format";

export const Route = createFileRoute("/_authenticated/attendance")({
  head: () => ({
    meta: [
      { title: "Attendance — Jupiter Gym" },
      {
        name: "description",
        content:
          "Daily QR check-in logs for Jupiter Gym with date filters, search and Excel export.",
      },
      { property: "og:title", content: "Attendance — Jupiter Gym" },
      { property: "og:description", content: "Check-in history for Jupiter Gym staff." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AttendancePage,
});

const field =
  "w-full border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary";

function AttendancePage() {
  const { data, isLoading, error } = useAttendance();
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [search, setSearch] = useState("");
  const [allDates, setAllDates] = useState(false);

  const rows = data ?? [];
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesDate = allDates || row.check_in_date === date;
      const name = row.members?.name?.toLowerCase() ?? "";
      const mobile = row.members?.mobile ?? "";
      const matchesSearch = !term || name.includes(term) || mobile.includes(term);
      return matchesDate && matchesSearch;
    });
  }, [rows, date, search, allDates]);

  const week = Array.from({ length: 7 }, (_, i) => {
    const key = dayjs().subtract(i, "day").format("YYYY-MM-DD");
    return rows.filter((r) => r.check_in_date === key).length;
  });
  const weekTotal = week.reduce((a, b) => a + b, 0);

  function exportRows() {
    try {
      exportToExcel(
        filtered.map((row) => ({
          Date: row.check_in_date,
          Time: formatTime(row.check_in_at),
          Member: row.members?.name ?? "",
          Mobile: row.members?.mobile ?? "",
          "Member ID": row.members?.member_code ?? "",
        })),
        `jupiter-gym-attendance-${allDates ? "all" : date}`,
        "Attendance",
      );
      toast.success("Excel file downloaded.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed.");
    }
  }

  return (
    <AdminShell
      title="Attendance Log"
      subtitle="Every scan, timestamped"
      actions={
        <button type="button" onClick={exportRows} className={btn}>
          <Download className="size-3" /> Excel
        </button>
      }
    >
      <div className="grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-3">
        <StatCard label="Shown" value={filtered.length} tone="primary" />
        <StatCard label="Today" value={week[0] ?? 0} />
        <StatCard
          label="Last 7 days"
          value={weekTotal}
          hint={`avg ${Math.round(weekTotal / 7)}/day`}
        />
      </div>

      <div className="grid gap-3 sm:flex sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setAllDates(false);
            }}
            className={`${field} sm:w-44`}
          />
          <button
            type="button"
            onClick={() => setAllDates((v) => !v)}
            className={
              allDates
                ? "bg-primary px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-primary-foreground"
                : "border border-border px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:border-primary hover:text-primary"
            }
          >
            All dates
          </button>
        </div>
        <div className="relative">
          <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search member"
            className={`${field} pl-9 sm:w-72`}
          />
        </div>
      </div>

      {isLoading ? (
        <LoadingState label="Loading attendance" />
      ) : error ? (
        <ErrorState message={error.message} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No check-ins" hint="Nothing recorded for this filter." />
      ) : (
        <div className="animate-slide w-full overflow-x-auto border border-border">
          <table className="w-full min-w-[560px] border-collapse text-left">
            <thead className="bg-muted/60 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
              <tr>
                <th className="border-b border-border p-4">Member</th>
                <th className="border-b border-border p-4">Date</th>
                <th className="border-b border-border p-4">Time</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filtered.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-border transition-colors hover:bg-accent/40"
                >
                  <td className="p-4">
                    <div className="font-semibold">{row.members?.name ?? "Member"}</div>
                    <div className="font-mono text-[10px] text-muted-foreground">
                      {row.members?.member_code ?? "—"} · {row.members?.mobile ?? "—"}
                    </div>
                  </td>
                  <td className="p-4 font-mono text-xs">{formatDate(row.check_in_date)}</td>
                  <td className="p-4 font-mono text-xs text-primary">
                    {formatTime(row.check_in_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
