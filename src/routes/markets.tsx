import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { TerminalLayout } from "@/components/xnova/Layout";
import { TokenHeader } from "@/components/xnova/TokenHeader";
import { PriceChart } from "@/components/xnova/PriceChart";
import { TradeTape } from "@/components/xnova/TradeTape";
import { WhalePanel } from "@/components/xnova/WhalePanel";
import { HoldersPanel } from "@/components/xnova/HoldersPanel";
import { IntelPanel, TransfersPanel } from "@/components/xnova/IntelPanel";
import { cn } from "@/lib/utils";

const TABS = ["Overview", "Chart", "Trades", "Holders", "Whales", "Liquidity", "Transactions"] as const;
type Tab = (typeof TABS)[number];

export const Route = createFileRoute("/markets")({
  head: () => ({
    meta: [
      { title: "XNOVA Markets — Live Solana Trading Terminal" },
      {
        name: "description",
        content:
          "Candlestick charts, live trade tape, whale activity, holders and liquidity for the XNOVA Solana token.",
      },
      { property: "og:title", content: "XNOVA Markets — Live Solana Trading Terminal" },
      {
        property: "og:description",
        content: "Real-time XNOVA candles, trades, whales, holders and liquidity on Solana Mainnet.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Markets,
});

function Markets() {
  const [tab, setTab] = useState<Tab>("Overview");

  return (
    <TerminalLayout>
      <div className="space-y-4">
        <TokenHeader />
        <div className="flex flex-wrap gap-1 border-b border-border pb-2">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "num rounded-sm px-3 py-1.5 text-[11px] uppercase tracking-widest transition-colors",
                tab === t
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-surface hover:text-foreground",
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "Overview" ? (
          <div className="space-y-4">
            <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
              <PriceChart />
              <TradeTape />
            </div>
            <IntelPanel />
          </div>
        ) : null}
        {tab === "Chart" ? <PriceChart /> : null}
        {tab === "Trades" ? <TradeTape limit={100} /> : null}
        {tab === "Holders" ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <HoldersPanel limit={50} />
            <IntelPanel />
          </div>
        ) : null}
        {tab === "Whales" ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <WhalePanel threshold={2500} />
            <WhalePanel threshold={10000} />
          </div>
        ) : null}
        {tab === "Liquidity" ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <IntelPanel />
            <TradeTape minUsd={1000} title="LARGE FLOW" />
          </div>
        ) : null}
        {tab === "Transactions" ? <TransfersPanel /> : null}
      </div>
    </TerminalLayout>
  );
}
