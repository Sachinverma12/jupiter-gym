import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "primary" | "warning" | "destructive";
}) {
  return (
    <div className="bg-background p-5 sm:p-6">
      <p className="label-mono mb-2">{label}</p>
      <p
        className={cn(
          "heading-display text-3xl sm:text-4xl",
          tone === "primary" && "text-primary",
          tone === "warning" && "text-warning",
          tone === "destructive" && "text-destructive",
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-2 font-mono text-[10px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
