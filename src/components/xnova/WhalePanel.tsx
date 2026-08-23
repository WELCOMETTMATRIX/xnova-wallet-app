import { useQuery } from "@tanstack/react-query";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { formatNum, formatUsd, shortAddress, solscanTx, timeAgo } from "@/lib/xnova/config";
import { tradesQuery } from "@/lib/xnova/queries";
import { cn } from "@/lib/utils";
import { Loading, Panel, Unavailable } from "./primitives";

export function WhalePanel({ threshold = 2500 }: { threshold?: number }) {
  const { data, isPending } = useQuery(tradesQuery(threshold));

  return (
    <Panel
      title="WHALE ACTIVITY"
      action={<span className="label-xs">≥ {formatUsd(threshold, 0)}</span>}
      dense
      className="h-[420px]"
    >
      <div className="h-full overflow-y-auto p-2">
        {isPending ? (
          <Loading label="Scanning large transactions" />
        ) : !data?.ok ? (
          <Unavailable source="GeckoTerminal trades" detail={data?.error} />
        ) : data.data.length === 0 ? (
          <Unavailable source="No whale activity in the recent window" />
        ) : (
          <ul className="space-y-1.5">
            {data.data.slice(0, 25).map((t) => {
              const buy = t.kind === "buy";
              const Row = t.txHash ? "a" : "div";
              return (
                <li key={t.id}>
                  <Row
                    {...(t.txHash
                      ? {
                          href: solscanTx(t.txHash),
                          target: "_blank",
                          rel: "noopener noreferrer nofollow",
                        }
                      : {})}
                    className={cn(
                      "flex items-center gap-3 rounded-sm border border-border bg-surface-2/40 px-3 py-2 transition-colors",
                      t.txHash && "hover:border-primary/60",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-7 shrink-0 items-center justify-center rounded-sm",
                        buy ? "bg-bull/10 text-bull" : "bg-bear/10 text-bear",
                      )}
                    >
                      {buy ? <ArrowUpRight className="size-4" /> : <ArrowDownRight className="size-4" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className={cn("num text-[11px] uppercase tracking-widest", buy ? "text-bull" : "text-bear")}>
                          Whale {t.kind}
                        </span>
                        <span className="num text-sm font-medium">{formatUsd(t.valueUsd)}</span>
                      </div>
                      <div className="num mt-0.5 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                        <span className="truncate">
                          {formatNum(t.amountToken)} XNOVA · {shortAddress(t.wallet)}
                        </span>
                        <span>{timeAgo(t.timestamp)}</span>
                      </div>
                    </div>
                  </Row>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Panel>
  );
}
