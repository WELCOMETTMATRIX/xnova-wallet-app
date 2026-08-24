import { AlertTriangle, Loader2 } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Panel({
  title,
  action,
  children,
  className,
  dense,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  dense?: boolean;
}) {
  return (
    <section className={cn("panel flex flex-col", className)}>
      {title ? (
        <header className="flex items-center justify-between gap-3 border-b border-border px-3 py-2">
          <h2 className="label-xs">{title}</h2>
          {action}
        </header>
      ) : null}
      <div className={cn(dense ? "p-0" : "p-3", "flex-1 min-h-0")}>{children}</div>
    </section>
  );
}

export function Stat({
  label,
  value,
  tone = "default",
  sub,
}: {
  label: string;
  value: ReactNode;
  tone?: "default" | "bull" | "bear";
  sub?: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <div className="label-xs">{label}</div>
      <div
        className={cn(
          "num mt-1 truncate text-base font-medium sm:text-lg",
          tone === "bull" && "text-bull",
          tone === "bear" && "text-bear",
        )}
      >
        {value}
      </div>
      {sub ? (
        <div className="num mt-0.5 truncate text-[11px] text-muted-foreground">{sub}</div>
      ) : null}
    </div>
  );
}

export function Unavailable({ source, detail }: { source: string; detail?: string | undefined }) {
  return (
    <div className="flex h-full min-h-24 flex-col items-center justify-center gap-1 px-4 py-6 text-center">
      <AlertTriangle className="size-4 text-warn" aria-hidden />
      <p className="text-sm text-foreground">Data temporarily unavailable</p>
      <p className="label-xs">{source}</p>
      {detail ? (
        <p className="max-w-sm truncate text-[10px] text-muted-foreground">{detail}</p>
      ) : null}
    </div>
  );
}

export function Loading({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex h-full min-h-24 items-center justify-center gap-2 py-6 text-muted-foreground">
      <Loader2 className="size-4 animate-spin" aria-hidden />
      <span className="label-xs">{label}</span>
    </div>
  );
}

export function LiveDot({ ok = true }: { ok?: boolean }) {
  return (
    <span
      className={cn("live-dot inline-block size-1.5 rounded-full", ok ? "bg-bull" : "bg-bear")}
      aria-hidden
    />
  );
}
