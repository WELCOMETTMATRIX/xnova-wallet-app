import { useQuery } from "@tanstack/react-query";

import { formatNum, formatPct, formatUsd, shortAddress, solscanTx, timeAgo } from "@/lib/xnova/config";
import { holdersQuery, marketQuery, tokenMetaQuery, transfersQuery } from "@/lib/xnova/queries";
import { Loading, Panel, Stat, Unavailable } from "./primitives";

export function IntelPanel() {
  const market = useQuery(marketQuery());
  const meta = useQuery(tokenMetaQuery());
  const holders = useQuery(holdersQuery(10));

  const m = market.data?.ok ? market.data.data : null;
  const md = meta.data?.ok ? meta.data.data : null;
  const top10 = holders.data?.ok
    ? holders.data.data.holders.reduce((acc, h) => acc + (h.share ?? 0), 0)
    : null;

  const buys = m?.txns24h.buys ?? null;
  const sells = m?.txns24h.sells ?? null;
  const pressure = buys != null && sells != null && buys + sells > 0 ? (buys / (buys + sells)) * 100 : null;
  const liqRatio = m?.liquidityUsd && m?.marketCap ? (m.liquidityUsd / m.marketCap) * 100 : null;

  return (
    <Panel title="XNOVA INTELLIGENCE">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Supply" value={formatNum(md?.supply ?? null)} sub={md ? `${md.decimals ?? "—"} decimals` : "On-chain"} />
        <Stat label="Holders" value={formatNum(md?.holders ?? null)} />
        <Stat
          label="Top 10 concentration"
          value={top10 != null && top10 > 0 ? `${top10.toFixed(2)}%` : "—"}
          sub="Wallet concentration"
        />
        <Stat
          label="Buy pressure 24h"
          value={pressure != null ? `${pressure.toFixed(1)}%` : "—"}
          tone={pressure == null ? "default" : pressure >= 50 ? "bull" : "bear"}
          sub={`${formatNum(buys)} buys / ${formatNum(sells)} sells`}
        />
        <Stat label="Liquidity / MCap" value={liqRatio != null ? `${liqRatio.toFixed(2)}%` : "—"} />
        <Stat label="24h volume" value={formatUsd(m?.volume24h ?? null)} />
        <Stat label="1h change" value={formatPct(m?.change.h1 ?? null)} tone={(m?.change.h1 ?? 0) >= 0 ? "bull" : "bear"} />
        <Stat label="6h change" value={formatPct(m?.change.h6 ?? null)} tone={(m?.change.h6 ?? 0) >= 0 ? "bull" : "bear"} />
      </div>
      <p className="mt-3 border-t border-border pt-2 text-[11px] text-muted-foreground">
        Signals are derived from live on-chain and market data only. This is not financial advice and
        no outcome is guaranteed. Always verify contracts independently.
      </p>
    </Panel>
  );
}

export function TransfersPanel() {
  const { data, isPending } = useQuery(transfersQuery(20));
  return (
    <Panel title="TOKEN TRANSFERS" dense className="h-[420px]" action={<span className="label-xs">On-chain</span>}>
      <div className="h-full overflow-y-auto">
        {isPending ? (
          <Loading label="Loading transfers" />
        ) : !data?.ok ? (
          <Unavailable source="Transfer data" detail={data?.error} />
        ) : (
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-surface">
              <tr className="border-b border-border">
                {["From", "To", "Amount", "Time"].map((h) => (
                  <th key={h} className="label-xs px-3 py-1.5 font-normal">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.data.map((t) => (
                <tr key={t.signature} className="border-b border-border/50 hover:bg-surface-2">
                  <td className="num px-3 py-1.5 text-[11px] text-muted-foreground">{shortAddress(t.from)}</td>
                  <td className="num px-3 py-1.5 text-[11px] text-muted-foreground">{shortAddress(t.to)}</td>
                  <td className="num px-3 py-1.5 text-[11px]">{formatNum(t.amount)}</td>
                  <td className="num px-3 py-1.5 text-[11px] text-muted-foreground">
                    <a
                      href={solscanTx(t.signature)}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="hover:text-primary"
                    >
                      {timeAgo(t.timestamp)}
                    </a>
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
