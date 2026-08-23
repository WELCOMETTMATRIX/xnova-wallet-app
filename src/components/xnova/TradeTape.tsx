import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";

import { formatNum, formatUsd, shortAddress, solscanTx, timeAgo } from "@/lib/xnova/config";
import { tradesQuery } from "@/lib/xnova/queries";
import { cn } from "@/lib/utils";
import { Loading, Panel, Unavailable } from "./primitives";

export function TradeTape({
  minUsd = 0,
  title = "LIVE TRADES",
  limit = 40,
}: {
  minUsd?: number;
  title?: string;
  limit?: number;
}) {
  const { data, isPending } = useQuery(tradesQuery(minUsd));

  return (
    <Panel title={title} dense className="h-[420px]">
      <div className="h-full overflow-y-auto">
        {isPending ? (
          <Loading label="Loading trades" />
        ) : !data?.ok ? (
          <Unavailable source="GeckoTerminal trades" detail={data?.error} />
        ) : data.data.length === 0 ? (
          <Unavailable source="No trades in the current window" />
        ) : (
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-surface">
              <tr className="border-b border-border">
                {["Side", "Value", "Amount", "Wallet", "Time", ""].map((h) => (
                  <th key={h} className="label-xs px-3 py-1.5 font-normal">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.data.slice(0, limit).map((t) => (
                <tr key={t.id} className="border-b border-border/50 hover:bg-surface-2">
                  <td className={cn("num px-3 py-1.5 text-[11px] font-medium", t.kind === "buy" ? "text-bull" : "text-bear")}>
                    {t.kind.toUpperCase()}
                  </td>
                  <td className="num px-3 py-1.5 text-[11px]">{formatUsd(t.valueUsd)}</td>
                  <td className="num px-3 py-1.5 text-[11px] text-muted-foreground">{formatNum(t.amountToken)}</td>
                  <td className="num px-3 py-1.5 text-[11px] text-muted-foreground">{shortAddress(t.wallet)}</td>
                  <td className="num px-3 py-1.5 text-[11px] text-muted-foreground">{timeAgo(t.timestamp)}</td>
                  <td className="px-3 py-1.5">
                    {t.txHash ? (
                      <a
                        href={solscanTx(t.txHash)}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="text-muted-foreground hover:text-primary"
                        aria-label="View transaction on Solscan"
                      >
                        <ExternalLink className="size-3" />
                      </a>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Panel>
  );
}
