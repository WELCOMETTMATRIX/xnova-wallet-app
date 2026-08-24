import { useQuery } from "@tanstack/react-query";
import { Check, Copy, ExternalLink } from "lucide-react";
import { useState } from "react";

import { XNOVA, formatNum, formatPct, formatUsd, shortAddress } from "@/lib/xnova/config";
import { marketQuery, tokenMetaQuery } from "@/lib/xnova/queries";
import { cn } from "@/lib/utils";
import { LiveDot, Stat } from "./primitives";

function CopyMint() {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(XNOVA.tokenMint);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="num inline-flex items-center gap-1.5 rounded-sm border border-border bg-surface px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
      aria-label="Copy token mint address"
    >
      {shortAddress(XNOVA.tokenMint, 6)}
      {copied ? <Check className="size-3 text-bull" /> : <Copy className="size-3" />}
    </button>
  );
}

export function ExternalBtn({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="num inline-flex items-center gap-1.5 rounded-sm border border-border bg-surface px-2.5 py-1.5 text-[11px] uppercase tracking-widest text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
    >
      {label}
      <ExternalLink className="size-3" aria-hidden />
    </a>
  );
}

export function TokenHeader() {
  const { data: market } = useQuery(marketQuery());
  const { data: meta } = useQuery(tokenMetaQuery());
  const m = market?.ok ? market.data : null;
  const h24 = m?.change.h24 ?? null;

  return (
    <div className="panel">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-3 py-2.5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-semibold tracking-tight">XNOVA</span>
            <span className="label-xs">{m?.baseName ?? "Solana Token"}</span>
          </div>
          <span className="num rounded-sm border border-border px-2 py-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">
            <LiveDot ok={Boolean(m)} /> {XNOVA.network}
          </span>
          <CopyMint />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <ExternalBtn href={XNOVA.links.dexscreener} label="Dexscreener" />
          <ExternalBtn href={XNOVA.links.pumpfun} label="Pump.fun" />
          <ExternalBtn href={XNOVA.links.solscan} label="Solscan" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 px-3 py-3 sm:grid-cols-3 lg:grid-cols-7">
        <Stat
          label="Price"
          value={formatUsd(m?.priceUsd, 8)}
          tone={h24 == null ? "default" : h24 >= 0 ? "bull" : "bear"}
          sub={
            m?.priceNative != null
              ? `${m.priceNative.toPrecision(4)} ${m.quoteSymbol ?? "SOL"}`
              : undefined
          }
        />
        <Stat
          label="24h"
          value={
            <span className={cn(h24 != null && (h24 >= 0 ? "text-bull" : "text-bear"))}>
              {formatPct(h24)}
            </span>
          }
          sub={`1h ${formatPct(m?.change.h1 ?? null)}`}
        />
        <Stat
          label="Market cap"
          value={formatUsd(m?.marketCap ?? null)}
          sub={`FDV ${formatUsd(m?.fdv ?? null)}`}
        />
        <Stat
          label="Liquidity"
          value={formatUsd(m?.liquidityUsd ?? null)}
          sub={m?.dexId ?? undefined}
        />
        <Stat
          label="24h volume"
          value={formatUsd(m?.volume24h ?? null)}
          sub={`${formatNum(m?.txns24h.buys ?? null)} buys / ${formatNum(m?.txns24h.sells ?? null)} sells`}
        />
        <Stat
          label="Holders"
          value={meta?.ok ? formatNum(meta.data.holders) : "—"}
          sub={meta?.ok ? `Supply ${formatNum(meta.data.supply)}` : "Solscan"}
        />
        <Stat
          label="Pair"
          value={shortAddress(XNOVA.primaryPair, 5)}
          sub={m?.quoteSymbol ? `XNOVA / ${m.quoteSymbol}` : "Primary pool"}
        />
      </div>
    </div>
  );
}
