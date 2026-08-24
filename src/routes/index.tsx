import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, Link } from "@tanstack/react-router";
import dayjs from "dayjs";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";

import { ThemeToggle } from "@/components/ThemeToggle";
import { PLAN_KEYS, PLANS, GYM } from "@/config/gym";
import { checkInByMobile, registerMember, type CheckInResult } from "@/lib/checkin.functions";
import { formatDate } from "@/utils/format";
import { registrationSchema, toNumber, type RegistrationInput } from "@/utils/validation";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Check In — Jupiter Gym" },
      {
        name: "description",
        content:
          "Scan the Jupiter Gym QR code, enter your mobile number and your attendance is marked instantly. New members register in seconds.",
      },
      { property: "og:title", content: "Check In — Jupiter Gym" },
      {
        property: "og:description",
        content: "One QR code. Instant gym check-in and membership registration at Jupiter Gym.",
      },
    ],
  }),
  component: CheckInPortal,
});

const field =
  "w-full border border-input bg-background px-3 py-3 text-sm outline-none transition-colors focus:border-primary";

function CheckInPortal() {
  const [mobile, setMobile] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [registering, setRegistering] = useState(false);

  async function handleCheckIn(event: React.FormEvent) {
    event.preventDefault();
    const digits = mobile.replace(/\D/g, "");
    if (digits.length < 10) {
      toast.error("Enter your 10 digit mobile number.");
      return;
    }
    setBusy(true);
    try {
      const res = await checkInByMobile({ data: { mobile } });
      setResult(res);
      if (res.status === "unknown") {
        setRegistering(true);
        toast.info("New here? Complete your registration below.");
      } else if (res.status === "checked_in") {
        toast.success("Check-in confirmed. Have a great session!");
      } else if (res.status === "already") {
        toast.info("You are already checked in for today.");
      } else {
        toast.warning("Your membership has expired. Please renew at the desk.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Check-in failed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setResult(null);
    setRegistering(false);
    setMobile("");
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-border px-5 py-4">
        <span className="heading-display truncate text-2xl italic">
          Jupiter<span className="text-primary">Gym</span>
        </span>
        <div className="flex shrink-0 items-center gap-2">
          <span className="size-2 animate-pulse rounded-full bg-primary" />
          <ThemeToggle />
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 p-6">
        <div className="space-y-1">
          <p className="label-mono">Access portal</p>
          <h1 className="heading-display text-5xl leading-[0.9] sm:text-6xl">
            {registering ? (
              <>
                New
                <br />
                Member
              </>
            ) : result ? (
              <>
                Welcome
                <br />
                Back
              </>
            ) : (
              <>
                Scan.
                <br />
                Check In.
              </>
            )}
          </h1>
        </div>

        {registering ? (
          <RegistrationForm
            mobile={mobile}
            onDone={(res) => {
              setResult(res);
              setRegistering(false);
              toast.success("Welcome to Jupiter Gym! You are checked in.");
            }}
            onCancel={reset}
          />
        ) : result && result.status !== "unknown" ? (
          <ResultCard result={result} onDone={reset} />
        ) : (
          <form onSubmit={handleCheckIn} className="animate-slide space-y-4">
            <div className="space-y-2">
              <label htmlFor="mobile" className="label-mono block">
                Mobile number
              </label>
              <input
                id="mobile"
                inputMode="numeric"
                autoComplete="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="98765 43210"
                maxLength={15}
                className={field}
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full bg-primary py-4 font-display text-lg uppercase tracking-wider text-primary-foreground transition-all hover:brightness-110 disabled:opacity-60"
            >
              {busy ? "Verifying…" : "Confirm check-in"}
            </button>
            <p className="text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              First visit? Your number registers you automatically.
            </p>
          </form>
        )}
      </div>

      <footer className="border-t border-border bg-muted/40 px-6 py-5">
        <Link
          to="/auth"
          className="flex w-full items-center justify-center gap-2 border border-border py-4 font-display text-sm uppercase tracking-widest transition-colors hover:border-primary hover:text-primary"
        >
          <ShieldCheck className="size-4" /> Staff login
        </Link>
      </footer>
    </div>
  );
}

function ResultCard({ result, onDone }: { result: CheckInResult; onDone: () => void }) {
  if (result.status === "unknown") return null;
  const expired = result.status === "expired";
  return (
    <div className="animate-stamp space-y-6 border border-border bg-card p-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4">
        <div className="min-w-0">
          <h2 className="heading-display truncate text-3xl">{result.name}</h2>
          <p className="font-mono text-xs text-primary">MEMBER ID: {result.memberCode}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="label-mono">Status</p>
          <p className={expired ? "font-bold text-destructive" : "font-bold text-primary"}>
            {expired ? "EXPIRED" : "ACTIVE"}
          </p>
        </div>
      </div>

      <div
        className={
          expired
            ? "bg-destructive p-4 text-center font-display text-xl uppercase tracking-wider text-destructive-foreground"
            : "bg-primary p-4 text-center font-display text-xl uppercase tracking-wider text-primary-foreground"
        }
      >
        {expired
          ? "Renew membership"
          : result.status === "already"
            ? "Already checked in"
            : "Confirmed check-in"}
      </div>

      <p className="text-center font-mono text-[10px] uppercase text-muted-foreground">
        {expired
          ? `EXPIRED ON ${formatDate(result.expiry)}`
          : `TIMESTAMP: ${dayjs(result.time).format("hh:mm:ss A")} // VALID TILL ${formatDate(result.expiry)}`}
      </p>

      <button
        type="button"
        onClick={onDone}
        className="flex w-full items-center justify-center gap-2 border border-border py-3 font-mono text-[11px] uppercase tracking-widest text-muted-foreground hover:border-primary hover:text-primary"
      >
        <ArrowLeft className="size-3" /> Done
      </button>
    </div>
  );
}

function RegistrationForm({
  mobile,
  onDone,
  onCancel,
}: {
  mobile: string;
  onDone: (result: CheckInResult) => void;
  onCancel: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegistrationInput>({
    resolver: zodResolver(registrationSchema),
    defaultValues: { mobile, plan: "monthly" },
  });

  const submit = handleSubmit(async (values) => {
    try {
      const age = toNumber(values.age);
      const res = await registerMember({
        data: {
          name: values.name,
          mobile: values.mobile,
          ...(age === undefined ? {} : { age }),
          ...(values.gender ? { gender: values.gender } : {}),
          plan: values.plan,
        },
      });
      onDone(res);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Registration failed.");
    }
  });

  return (
    <form onSubmit={submit} className="animate-slide space-y-4 border border-border bg-card p-6">
      <div className="space-y-2">
        <label className="label-mono block">Full name</label>
        <input {...register("name")} className={field} placeholder="Your name" />
        {errors.name ? <p className="text-xs text-destructive">{errors.name.message}</p> : null}
      </div>
      <div className="space-y-2">
        <label className="label-mono block">Mobile</label>
        <input {...register("mobile")} inputMode="numeric" className={field} />
        {errors.mobile ? <p className="text-xs text-destructive">{errors.mobile.message}</p> : null}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <label className="label-mono block">Age (optional)</label>
          <input {...register("age")} inputMode="numeric" className={field} />
          {errors.age ? <p className="text-xs text-destructive">{errors.age.message}</p> : null}
        </div>
        <div className="space-y-2">
          <label className="label-mono block">Gender (optional)</label>
          <select {...register("gender")} className={field} defaultValue="">
            <option value="">—</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <label className="label-mono block">Membership plan</label>
        <select {...register("plan")} className={field}>
          {PLAN_KEYS.map((key) => (
            <option key={key} value={key}>
              {PLANS[key].label} — {GYM.currency}
              {PLANS[key].price}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-primary py-4 font-display text-lg uppercase tracking-wider text-primary-foreground transition-all hover:brightness-110 disabled:opacity-60"
      >
        {isSubmitting ? "Registering…" : "Register & check in"}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="w-full border border-border py-3 font-mono text-[11px] uppercase tracking-widest text-muted-foreground hover:border-primary hover:text-primary"
      >
        Cancel
      </button>
    </form>
  );
}
