import { createFileRoute } from "@tanstack/react-router";
import { Copy, Printer } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import { AdminShell, btn, btnPrimary } from "@/components/AdminShell";
import { GYM } from "@/config/gym";

export const Route = createFileRoute("/_authenticated/qr-code")({
  head: () => ({
    meta: [
      { title: "Entrance QR — Jupiter Gym" },
      {
        name: "description",
        content:
          "Print the static Jupiter Gym entrance QR code that members scan to check in or register.",
      },
      { property: "og:title", content: "Entrance QR — Jupiter Gym" },
      { property: "og:description", content: "Static check-in QR code for Jupiter Gym." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: QrPage,
});

function QrPage() {
  const [url, setUrl] = useState("");

  useEffect(() => {
    setUrl(window.location.origin + "/");
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Check-in link copied.");
    } catch {
      toast.error("Could not copy the link.");
    }
  }

  function download() {
    const canvas = document.querySelector<HTMLCanvasElement>("#gym-qr canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = "jupiter-gym-checkin-qr.png";
    link.click();
  }

  return (
    <AdminShell title="Entrance QR" subtitle="One static code — print it once, use it forever">
      <div className="animate-slide grid gap-8 lg:grid-cols-[auto_minmax(0,1fr)]">
        <div className="space-y-4 border border-border bg-card p-8 text-center">
          <div className="label-mono">{GYM.name}</div>
          <div id="gym-qr" className="inline-block bg-white p-4">
            {url ? <QRCodeCanvas value={url} size={220} level="M" includeMargin={false} /> : null}
          </div>
          <div className="heading-display text-xl">Scan to check in</div>
          <p className="text-xs text-muted-foreground">
            New members register in the same flow — no app required.
          </p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <div className="label-mono">Check-in link</div>
            <div className="border border-border bg-muted/40 p-3 font-mono text-xs break-all">
              {url || "…"}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={download} className={btnPrimary}>
              Download PNG
            </button>
            <button type="button" onClick={copy} className={btn}>
              <Copy className="size-3" /> Copy link
            </button>
            <button type="button" onClick={() => window.print()} className={btn}>
              <Printer className="size-3" /> Print
            </button>
          </div>

          <div className="space-y-3 border-t border-border pt-6">
            <h2 className="heading-display text-lg">How it works</h2>
            <ol className="space-y-3 text-sm text-muted-foreground">
              {[
                "Print the code and mount it at the entrance desk.",
                "A member scans it with any phone camera — no app needed.",
                "They enter their mobile number and are checked in instantly.",
                "Unknown numbers get the quick registration form instead.",
                "Every scan lands in Attendance in real time.",
              ].map((step, i) => (
                <li key={step} className="flex gap-3">
                  <span className="font-mono text-xs text-primary">0{i + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
