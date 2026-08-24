import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { TerminalLayout } from "@/components/xnova/Layout";
import { LiveDot, Panel, Stat } from "@/components/xnova/primitives";
import { TELEGRAM_ICON, XNOVA, timeAgo } from "@/lib/xnova/config";
import { alertStatusQuery, publicConfigQuery } from "@/lib/xnova/queries";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/alerts")({
  head: () => ({
    meta: [
      { title: "XNOVA Alerts — Telegram Notifications for Every Trade" },
      {
        name: "description",
        content:
          "Automated Telegram alerts for XNOVA buys, sells, whale trades, price moves, liquidity and volume changes on Solana.",
      },
      { property: "og:title", content: "XNOVA Alerts — Telegram Notifications" },
      {
        property: "og:description",
        content:
          "Configure and monitor the XNOVA Telegram alert engine for every on-chain buy and sell.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Alerts,
});

const ALERT_TYPES = [
  ["PRICE", "Absolute price crosses a level"],
  ["PRICE %", "1h move exceeds the configured percentage"],
  ["VOLUME", "24h volume spike versus the trailing window"],
  ["LIQUIDITY", "Pool liquidity added or removed"],
  ["WHALE BUY", "Buy above the whale USD threshold"],
  ["WHALE SELL", "Sell above the whale USD threshold"],
  ["LARGE TRANSFER", "Token transfer above threshold"],
  ["NEW HOLDER", "Holder count change detected via Solscan"],
  ["UNUSUAL ACTIVITY", "Buy/sell imbalance outside normal range"],
] as const;

const COMMANDS = [
  "/start",
  "/help",
  "/token",
  "/price",
  "/chart",
  "/holders",
  "/volume",
  "/liquidity",
  "/whales",
  "/alerts",
  "/watch",
  "/unwatch",
  "/status",
];

function Alerts() {
  const { data: config } = useQuery(publicConfigQuery());
  const { data: status } = useQuery(alertStatusQuery());

  const configured = Boolean(config?.telegramConfigured);

  return (
    <TerminalLayout>
      <div className="space-y-4">
        <header className="panel flex flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">ALERT ENGINE</h1>
            <p className="mt-1 max-w-2xl text-[11px] leading-relaxed text-muted-foreground">
              Every qualifying XNOVA buy and sell is pushed to Telegram with value, amount, wallet
              and a direct explorer link. Credentials live server-side only.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <img src={TELEGRAM_ICON} alt="Telegram" className="size-6" />
            <span
              className={cn(
                "num rounded-sm border px-2 py-1 text-[11px] uppercase tracking-widest",
                configured ? "border-bull/50 text-bull" : "border-warn/50 text-warn",
              )}
            >
              <LiveDot ok={configured} /> {configured ? "Bot online" : "Bot not configured"}
            </span>
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-3">
          <Panel title="ENGINE STATUS" className="lg:col-span-1">
            <div className="grid grid-cols-2 gap-4">
              <Stat label="Notifications sent" value={status?.sent ?? 0} />
              <Stat
                label="Last scan"
                value={status?.lastRunAt ? timeAgo(status.lastRunAt) : "—"}
                sub={status?.lastError ? "Last scan errored" : "Healthy"}
              />
              <Stat
                label="Solscan"
                value={config?.solscanConfigured ? "Connected" : "Not configured"}
              />
              <Stat
                label="Custom RPC"
                value={config?.solanaRpcConfigured ? "Connected" : "Public RPC"}
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => scan.mutate()}
                disabled={scan.isPending}
                className="num rounded-sm bg-primary px-3 py-2 text-[11px] uppercase tracking-widest text-primary-foreground disabled:opacity-50"
              >
                {scan.isPending ? "Scanning…" : "Run scan now"}
              </button>
              <button
                type="button"
                onClick={() => test.mutate()}
                disabled={test.isPending || !configured}
                className="num rounded-sm border border-border px-3 py-2 text-[11px] uppercase tracking-widest text-muted-foreground hover:text-foreground disabled:opacity-40"
              >
                Send test alert
              </button>
            </div>
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="num mt-2 w-full rounded-sm border border-border bg-background px-3 py-2 text-[11px] outline-none"
              aria-label="Test message"
            />
          </Panel>

          <Panel title="ALERT TYPES" className="lg:col-span-2">
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {ALERT_TYPES.map(([name, body]) => (
                <div key={name} className="rounded-sm border border-border bg-surface-2/40 p-3">
                  <span className="num text-[11px] uppercase tracking-widest text-primary">
                    {name}
                  </span>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{body}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">
              Thresholds are configured server-side via{" "}
              <span className="num">XNOVA_ALERT_MIN_TRADE_USD</span>,{" "}
              <span className="num">XNOVA_ALERT_WHALE_USD</span> and{" "}
              <span className="num">XNOVA_ALERT_PRICE_PCT</span>.
            </p>
          </Panel>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="BOT COMMANDS">
            <div className="flex flex-wrap gap-1.5">
              {COMMANDS.map((c) => (
                <span
                  key={c}
                  className="num rounded-sm border border-border px-2 py-1 text-[11px] text-muted-foreground"
                >
                  {c}
                </span>
              ))}
            </div>
          </Panel>
          <Panel title="NOTIFICATION FORMAT">
            <pre className="num overflow-x-auto whitespace-pre-wrap rounded-sm border border-border bg-background p-3 text-[11px] leading-relaxed text-muted-foreground">
              {`🚨 XNOVA WHALE ALERT

Type: BUY
Value: $8,421
Amount: 1,245,000 XNOVA
Price: $0.00000672
Wallet: 7x91...K3fA

View Transaction →`}
            </pre>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Token: <span className="num">{XNOVA.tokenMint}</span>
            </p>
          </Panel>
        </div>
      </div>
    </TerminalLayout>
  );
}
