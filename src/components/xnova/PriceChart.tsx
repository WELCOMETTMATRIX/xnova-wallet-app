import { useQuery } from "@tanstack/react-query";
import { ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense, useState } from "react";

import { TIMEFRAMES, type TimeframeLabel } from "@/lib/xnova/config";
import { candlesQuery } from "@/lib/xnova/queries";
import { cn } from "@/lib/utils";
import { Loading, Unavailable } from "./primitives";

const CandleCanvas = lazy(() =>
  import("./CandleCanvas").then((m) => ({ default: m.CandleCanvas })),
);

export function PriceChart() {
  const [tf, setTf] = useState<TimeframeLabel>("1H");
  const [showMa, setShowMa] = useState(true);
  const { data, isPending } = useQuery(candlesQuery(tf));

  return (
    <div className="panel flex h-[420px] flex-col sm:h-[520px]">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
        <div className="flex items-center gap-2">
          <h2 className="label-xs">XNOVA / SOL · CANDLES</h2>
        </div>
        <div className="flex items-center gap-1">
          {TIMEFRAMES.map((t) => (
            <button
              key={t.label}
              type="button"
              onClick={() => setTf(t.label)}
              className={cn(
                "num rounded-sm px-2 py-1 text-[11px] transition-colors",
                tf === t.label
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-surface-2 hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowMa((v) => !v)}
            className={cn(
              "num ml-1 rounded-sm border border-border px-2 py-1 text-[11px] transition-colors",
              showMa ? "text-foreground" : "text-muted-foreground",
            )}
          >
            MA
          </button>
        </div>
      </header>
      <div className="min-h-0 flex-1">
        {isPending ? (
          <Loading label="Loading market data" />
        ) : !data?.ok ? (
          <Unavailable source="GeckoTerminal OHLCV" detail={data?.error} />
        ) : data.data.length === 0 ? (
          <Unavailable source="No candles for this timeframe" />
        ) : (
          <ClientOnly fallback={<Loading label="Rendering chart" />}>
            <Suspense fallback={<Loading label="Rendering chart" />}>
              <CandleCanvas candles={data.data} showMa={showMa} />
            </Suspense>
          </ClientOnly>
        )}
      </div>
    </div>
  );
}
