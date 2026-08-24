import { cn } from "@/lib/utils";

type Tone = "primary" | "warning" | "destructive" | "muted";

const TONES: Record<Tone, string> = {
  primary: "bg-primary/10 text-primary ring-primary/25",
  warning: "bg-warning/10 text-warning ring-warning/25",
  destructive: "bg-destructive/10 text-destructive ring-destructive/25",
  muted: "bg-muted text-muted-foreground ring-border",
};

export function StatusBadge({
  children,
  tone = "muted",
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-tight ring-1",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export const statusTone = (status: string): Tone =>
  status === "active" || status === "paid"
    ? "primary"
    : status === "expiring" || status === "pending"
      ? "warning"
      : status === "expired" || status === "overdue"
        ? "destructive"
        : "muted";
