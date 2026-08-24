export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="border border-dashed border-border p-10 text-center">
      <p className="heading-display text-lg">{title}</p>
      {hint ? <p className="mt-2 text-sm text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 border border-border p-10">
      <span className="size-2 animate-pulse rounded-full bg-primary" />
      <span className="label-mono">{label}…</span>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="border border-destructive/40 bg-destructive/5 p-6">
      <p className="heading-display text-base text-destructive">Something went wrong</p>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
