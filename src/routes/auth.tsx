import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Staff Login — Jupiter Gym" },
      {
        name: "description",
        content: "Secure sign in for Jupiter Gym staff to manage members, attendance and payments.",
      },
      { property: "og:title", content: "Staff Login — Jupiter Gym" },
      {
        property: "og:description",
        content: "Secure admin access to the Jupiter Gym operations console.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

const field =
  "w-full border border-input bg-background px-3 py-3 text-sm outline-none transition-colors focus:border-primary";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back.");
        navigate({ to: "/dashboard", replace: true });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: name },
          },
        });
        if (error) throw error;
        if (data.session) {
          toast.success("Account created.");
          navigate({ to: "/dashboard", replace: true });
        } else {
          toast.info("Check your email to confirm your account, then sign in.");
          setMode("signin");
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Authentication failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-border px-5 py-4">
        <Link to="/" className="heading-display truncate text-2xl italic">
          Jupiter<span className="text-primary">Gym</span>
        </Link>
        <ThemeToggle />
      </header>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 p-6">
        <div className="space-y-1">
          <p className="label-mono">Restricted area</p>
          <h1 className="heading-display text-5xl leading-[0.9]">
            Staff
            <br />
            Access
          </h1>
        </div>

        <form
          onSubmit={submit}
          className="animate-slide space-y-4 border border-border bg-card p-6"
        >
          {mode === "signup" ? (
            <div className="space-y-2">
              <label className="label-mono block">Full name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={field}
                required
              />
            </div>
          ) : null}
          <div className="space-y-2">
            <label className="label-mono block">Email</label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={field}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="label-mono block">Password</label>
            <input
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={field}
              minLength={6}
              required
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full bg-primary py-4 font-display text-lg uppercase tracking-wider text-primary-foreground transition-all hover:brightness-110 disabled:opacity-60"
          >
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="w-full font-mono text-[11px] uppercase tracking-widest text-muted-foreground hover:text-primary"
          >
            {mode === "signin" ? "Create the first admin account" : "I already have an account"}
          </button>
        </form>
      </div>
    </div>
  );
}
