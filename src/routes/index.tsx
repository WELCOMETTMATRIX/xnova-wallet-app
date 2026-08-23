import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Bell, LineChart, ShieldCheck, Waves } from "lucide-react";

import { HeroCanvas } from "@/components/xnova/HeroCanvas";
import { TerminalLayout } from "@/components/xnova/Layout";
import { TokenHeader, ExternalBtn } from "@/components/xnova/TokenHeader";
import { PriceChart } from "@/components/xnova/PriceChart";
import { TradeTape } from "@/components/xnova/TradeTape";
import { WhalePanel } from "@/components/xnova/WhalePanel";
import { HoldersPanel } from "@/components/xnova/HoldersPanel";
import { IntelPanel, TransfersPanel } from "@/components/xnova/IntelPanel";
import { StakingZone } from "@/components/xnova/StakingZone";
import { XNOVA } from "@/lib/xnova/config";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "XNOVA — Solana Web3 Intelligence Terminal" },
      {
        name: "description",
        content:
          "XNOVA terminal: live Solana token price, candles, whale tracking, holders, dApp explorer and Telegram alerts — real on-chain data, open source.",
      },
      { property: "og:title", content: "XNOVA — Solana Web3 Intelligence Terminal" },
      {
        property: "og:description",
        content:
          "Live XNOVA market data, whale activity, holder intelligence and automated Telegram alerts on Solana Mainnet.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Hero() {
  return (
    <section className="relative -mx-3 mb-4 overflow-hidden border-b border-border sm:-mx-5">
      <HeroCanvas className="absolute inset-0 h-full w-full" />
      <div className="relative mx-auto flex max-w-[1800px] flex-col gap-6 px-3 py-16 sm:px-5 sm:py-24">
        <div className="max-w-2xl">
          <p className="label-xs">Solana Mainnet · Open Source</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-6xl">
            XNOVA
            <span className="mt-2 block text-base font-normal tracking-[0.3em] text-muted-foreground sm:text-lg">
              SOLANA WEB3 INTELLIGENCE TERMINAL
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Charts, whale tracking, holder intelligence, wallet portfolio, dApp discovery and
            automated Telegram notifications for every buy and sell. Real data only — never
            simulated.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Link
              to="/markets"
              className="num inline-flex items-center gap-2 rounded-sm bg-primary px-4 py-2.5 text-[11px] uppercase tracking-widest text-primary-foreground transition-opacity hover:opacity-90"
            >
              Open market terminal <ArrowRight className="size-3.5" />
            </Link>
            <ExternalBtn href={XNOVA.links.dexscreener} label="View on DexScreener" />
            <ExternalBtn href={XNOVA.links.pumpfun} label="View on Pump.fun" />
            <ExternalBtn href={XNOVA.website} label={XNOVA.website.replace(/^https?:\/\//, "")} />
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: LineChart, title: "Live market", body: "Candles, volume and depth from the primary XNOVA pool." },
            { icon: Waves, title: "Whale radar", body: "Large buys, sells and transfers with explorer links." },
            { icon: Bell, title: "Telegram alerts", body: "Every qualifying transaction pushed to chat automatically." },
            { icon: ShieldCheck, title: "Non-custodial", body: "No seed phrases, no key storage. Signing stays in your wallet." },
          ].map((f) => (
            <div key={f.title} className="panel bg-background/60 p-3 backdrop-blur">
              <f.icon className="size-4 text-primary" aria-hidden />
              <h2 className="mt-2 text-sm font-medium">{f.title}</h2>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Home() {
  return (
    <TerminalLayout>
      <Hero />
      <div className="space-y-4">
        <TokenHeader />
        <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
          <PriceChart />
          <TradeTape />
        </div>
        <IntelPanel />
        <div className="grid gap-4 lg:grid-cols-3">
          <WhalePanel />
          <HoldersPanel />
          <TransfersPanel />
        </div>
        <StakingZone />
      </div>
    </TerminalLayout>
  );
}
