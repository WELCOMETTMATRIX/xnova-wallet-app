import { Link } from "@tanstack/react-router";
import { BadgeCheck, DatabaseZap, LockKeyhole, Menu, ShieldCheck, X } from "lucide-react";
import { useState, type ReactNode } from "react";

import { TELEGRAM_ICON, XNOVA } from "@/lib/xnova/config";
import { cn } from "@/lib/utils";
import { WalletConnect } from "./WalletConnect";

const NAV = [
  { to: "/", label: "Terminal" },
  { to: "/markets", label: "Markets" },
  { to: "/dapps", label: "dApps" },
  { to: "/ai", label: "AI Chat" },
  { to: "/portfolio", label: "Portfolio" },
  { to: "/alerts", label: "Alerts" },
  { to: "/staking", label: "Staking" },
] as const;

const TRUST_BADGES = [
  { label: "Non-custodial", detail: "Keys stay in wallet", icon: LockKeyhole },
  { label: "Live data", detail: "Provider failover", icon: DatabaseZap },
  { label: "Verified links", detail: "Official explorers", icon: BadgeCheck },
  { label: "Risk aware", detail: "No seed phrases", icon: ShieldCheck },
] as const;

export function TrustBadges({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn("flex flex-wrap gap-2", compact && "gap-1.5")}>
      {TRUST_BADGES.map((badge) => (
        <div
          key={badge.label}
          className={cn(
            "inline-flex items-center gap-2 rounded-sm border border-primary/25 bg-primary/5 text-foreground",
            compact ? "px-2 py-1" : "px-3 py-2",
          )}
        >
          <badge.icon className="size-3.5 text-primary" aria-hidden />
          <span className="leading-none">
            <span className="num block text-[10px] uppercase tracking-widest">{badge.label}</span>
            {!compact ? (
              <span className="mt-1 block text-[10px] text-muted-foreground">{badge.detail}</span>
            ) : null}
          </span>
        </div>
      ))}
    </div>
  );
}

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="flex size-7 items-center justify-center rounded-sm border border-primary/60 bg-primary/10">
        <span className="num text-[11px] font-bold text-primary">X</span>
      </span>
      <span className="leading-none">
        <span className="block text-sm font-semibold tracking-[0.2em]">XNOVA</span>
        <span className="label-xs hidden sm:block">SOLANA WEB3 TERMINAL</span>
      </span>
    </Link>
  );
}

export function TerminalLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1800px] items-center justify-between gap-4 px-3 sm:px-5">
          <div className="flex items-center gap-6">
            <Brand />
            <nav className="hidden items-center gap-1 lg:flex">
              {NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  activeOptions={{ exact: item.to === "/" }}
                  className="num rounded-sm px-2.5 py-1.5 text-[11px] uppercase tracking-widest text-muted-foreground transition-colors hover:bg-surface hover:text-foreground [&.active]:bg-surface [&.active]:text-foreground"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={XNOVA.links.twitter}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="num hidden rounded-sm border border-border px-2 py-1.5 text-[11px] uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
            >
              X
            </a>
            <WalletConnect />
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="rounded-sm border border-border p-2 text-muted-foreground lg:hidden"
              aria-label="Toggle navigation"
            >
              {open ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
          </div>
        </div>
        {open ? (
          <nav className="grid grid-cols-2 gap-1 border-t border-border p-2 lg:hidden">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="num rounded-sm px-3 py-2 text-[11px] uppercase tracking-widest text-muted-foreground hover:bg-surface hover:text-foreground [&.active]:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        ) : null}
      </header>

      <main className="mx-auto w-full max-w-[1800px] flex-1 px-3 py-4 sm:px-5">{children}</main>

      <footer className="border-t border-border bg-surface/40">
        <div className="mx-auto flex max-w-[1800px] flex-col gap-4 px-3 py-6 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Brand />
            <p className="mt-2 max-w-md text-[11px] text-muted-foreground">
              Open-source Solana intelligence terminal. Market, on-chain and alerting data is
              fetched live from public providers — never fabricated. Not financial advice.
            </p>
            <div className="mt-3">
              <TrustBadges compact />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {[
              ["Website", XNOVA.website],
              ["DexScreener", XNOVA.links.dexscreener],
              ["Pump.fun", XNOVA.links.pumpfun],
              ["Solscan", XNOVA.links.solscan],
              ["GitHub", XNOVA.links.github],
            ].map(([label, href]) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className={cn(
                  "num rounded-sm border border-border px-2.5 py-1.5 text-[11px] uppercase tracking-widest",
                  "text-muted-foreground transition-colors hover:border-primary hover:text-foreground",
                )}
              >
                {label}
              </a>
            ))}
            <Link
              to="/alerts"
              className="num inline-flex items-center gap-2 rounded-sm border border-border px-2.5 py-1.5 text-[11px] uppercase tracking-widest text-muted-foreground hover:border-primary hover:text-foreground"
            >
              <img src={TELEGRAM_ICON} alt="" className="size-3.5" loading="lazy" />
              Telegram bot
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
