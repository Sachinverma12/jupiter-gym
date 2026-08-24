import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Menu } from "lucide-react";
import { useState } from "react";

import { ThemeToggle } from "@/components/ThemeToggle";
import { GYM } from "@/config/gym";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/members", label: "Members" },
  { to: "/attendance", label: "Attendance" },
  { to: "/payments", label: "Payments" },
  { to: "/qr-code", label: "QR Code" },
] as const;

export function AdminShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 sm:px-8">
          <div className="flex min-w-0 items-center gap-6">
            <Link to="/dashboard" className="heading-display shrink-0 text-xl italic">
              Jupiter<span className="text-primary">Gym</span>
            </Link>
            <nav className="hidden gap-4 lg:flex">
              {NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
                  activeProps={{ className: "font-mono text-xs text-primary" }}
                >
                  [ {item.label} ]
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={signOut}
              className="grid size-9 place-items-center border border-border text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
              aria-label="Sign out"
            >
              <LogOut className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="grid size-9 place-items-center border border-border text-muted-foreground lg:hidden"
              aria-label="Toggle navigation"
            >
              <Menu className="size-4" />
            </button>
          </div>
        </div>
        {open ? (
          <nav className="grid gap-1 border-t border-border px-4 py-3 lg:hidden">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="font-mono text-xs text-muted-foreground"
                activeProps={{ className: "font-mono text-xs text-primary" }}
              >
                [ {item.label} ]
              </Link>
            ))}
          </nav>
        ) : null}
      </header>

      <main className={cn("mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-8")}>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 border-b border-border pb-4 sm:flex sm:justify-between">
          <div className="min-w-0">
            <h1 className="heading-display text-2xl sm:text-3xl">{title}</h1>
            <p className="label-mono mt-1">{subtitle ?? GYM.name + " operations console"}</p>
          </div>
          {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
        </div>
        {children}
      </main>
    </div>
  );
}

export const btn =
  "inline-flex items-center gap-2 border border-border px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground transition-colors hover:border-primary hover:text-primary";
export const btnPrimary =
  "inline-flex items-center gap-2 bg-primary px-4 py-2 font-display text-xs uppercase tracking-widest text-primary-foreground transition-all hover:brightness-110";
