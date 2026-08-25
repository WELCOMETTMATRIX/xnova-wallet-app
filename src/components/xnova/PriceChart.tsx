import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, RefreshCw } from "lucide-react";

import { XNOVA, formatUsd } from "@/lib/xnova/config";
import { marketQuery } from "@/lib/xnova/queries";
import type { Candle } from "@/lib/xnova/types";
import { cn } from "@/lib/utils";
import { CandleCanvas } from "./CandleCanvas";

type SourceId = "dexscreener" | "geckoterminal" | "native";

interface ChartSource {
  id: SourceId;
  label: string;
  /** Embeddable iframe URL, or null for the internally rendered chart. */
  embed: string | null;
  link: string;
}

const SOURCES: ChartSource[] = [
  {
    id: "dexscreener",
    label: "DEXSCREENER",
    embed: `${XNOVA.links.dexscreener}?embed=1&theme=dark&trades=0&info=0`,
    link: XNOVA.links.dexscreener,
  },
  {
    id: "geckoterminal",
    label: "GECKOTERMINAL",
    embed: `https://www.geckoterminal.com/solana/pools/${XNOVA.primaryPair}?embed=1&info=0&swaps=0&grayscale=0&light_chart=0`,
    link: XNOVA.links.geckoterminal,
  },
  {
    id: "native",
    label: "SOLSCAN / JUPITER FEED",
    embed: null,
    link: XNOVA.links.jupiter,
  },
];

/** Iframes that never fire `load` within this window are treated as blocked. */
const EMBED_TIMEOUT_MS = 9_000;

/** Tick history survives remounts so the native fallback is never empty twice. */
const TICKS: { t: number; price: number }[] = [];
const BUCKET_SECONDS = 60;

function pushTick(price: number, at: number) {
  const last = TICKS[TICKS.length - 1];
  if (last && Math.abs(last.t - at) < 1_000 && last.price === price) return;
  TICKS.push({ t: at, price });
  if (TICKS.length > 2_000) TICKS.splice(0, TICKS.length - 2_000);
}

function ticksToCandles(): Candle[] {
  const buckets = new Map<number, Candle>();
  for (const tick of TICKS) {
    const time = Math.floor(tick.t / 1000 / BUCKET_SECONDS) * BUCKET_SECONDS;
    const existing = buckets.get(time);
    if (!existing) {
      buckets.set(time, {
        time,
        open: tick.price,
        high: tick.price,
        low: tick.price,
        close: tick.price,
        volume: 0,
      });
      continue;
    }
    existing.high = Math.max(existing.high, tick.price);
    existing.low = Math.min(existing.low, tick.price);
    existing.close = tick.price;
  }
  return [...buckets.values()].sort((a, b) => a.time - b.time);
}

export function PriceChart() {
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [pinned, setPinned] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const source = SOURCES[index]!;

  const market = useQuery({ ...marketQuery(), enabled: source.id === "native" || index > 0 });
  const price = market.data?.ok ? market.data.data.priceUsd : null;

  useEffect(() => {
    if (price != null && Number.isFinite(price)) pushTick(price, Date.now());
  }, [price, market.dataUpdatedAt]);

  const candles = useMemo(
    () => (source.id === "native" ? ticksToCandles() : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [source.id, market.dataUpdatedAt],
  );

  const advance = useCallback(() => {
    setIndex((current) => (current + 1 < SOURCES.length ? current + 1 : current));
  }, []);

  // Failover: if the embed never loads, walk down the provider chain.
  useEffect(() => {
    if (source.embed == null) return;
    setLoaded(false);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (!pinned) advance();
    }, EMBED_TIMEOUT_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [source.embed, pinned, advance]);

  const select = (i: number) => {
    setPinned(true);
    setIndex(i);
  };

  return (
    <div className="panel flex h-[420px] flex-col overflow-hidden sm:h-[520px]">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="label-xs">XNOVA / SOL · {source.label}</h2>
          {source.embed && !loaded ? (
            <span className="num flex items-center gap-1 text-[10px] text-muted-foreground">
              <RefreshCw className="size-3 animate-spin" /> LOADING
            </span>
          ) : null}
          {source.id === "native" && price != null ? (
            <span className="num text-[10px] text-primary">{formatUsd(price, 8)}</span>
          ) : null}
        </div>
        <div className="flex items-center gap-1">
          {SOURCES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => select(i)}
              className={cn(
                "num rounded-sm border px-2 py-1 text-[10px] uppercase tracking-wider transition-colors",
                i === index
                  ? "border-primary/60 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {s.id === "native" ? "FEED" : s.id.slice(0, 4)}
            </button>
          ))}
          <a
            href={source.link}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="inline-flex items-center gap-1 rounded-sm border border-border px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/60 hover:text-primary"
          >
            Open <ExternalLink className="size-3" />
          </a>
        </div>
      </header>

      {source.embed ? (
        <iframe
          key={source.id}
          title={`XNOVA ${source.label} chart`}
          src={source.embed}
          onLoad={() => setLoaded(true)}
          className="min-h-0 flex-1 border-0 bg-background"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allow="clipboard-write"
        />
      ) : (
        <div className="min-h-0 flex-1 p-2">
          {candles.length > 1 ? (
            <CandleCanvas candles={candles} showMa={false} />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-[11px] text-muted-foreground">
              <p>
                Building live tick chart from the on-chain price feed
                {price != null ? ` · ${formatUsd(price, 8)}` : ""}.
              </p>
              <div className="flex gap-2">
                <a
                  href={XNOVA.links.jupiter}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="rounded-sm border border-border px-2 py-1 hover:border-primary/60 hover:text-primary"
                >
                  Jupiter chart
                </a>
                <a
                  href={XNOVA.links.solscan}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="rounded-sm border border-border px-2 py-1 hover:border-primary/60 hover:text-primary"
                >
                  Solscan token
                </a>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
