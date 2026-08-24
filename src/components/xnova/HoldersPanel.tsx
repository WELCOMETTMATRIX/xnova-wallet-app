import { useQuery } from "@tanstack/react-query";

import { formatNum, shortAddress, solscanAccount } from "@/lib/xnova/config";
import { holdersQuery } from "@/lib/xnova/queries";
import { Loading, Panel, Unavailable } from "./primitives";

export function HoldersPanel({ limit = 20 }: { limit?: number }) {
  const { data, isPending } = useQuery(holdersQuery(limit));

  return (
    <Panel
      title="TOP HOLDERS"
      dense
      className="h-[420px]"
      action={<span className="label-xs">On-chain</span>}
    >
      <div className="h-full overflow-y-auto">
        {isPending ? (
          <Loading label="Loading holders" />
        ) : !data?.ok ? (
          <Unavailable source="Holder data" detail={data?.error} />
        ) : (
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-surface">
              <tr className="border-b border-border">
                {["#", "Wallet", "Balance", "Share"].map((h) => (
                  <th key={h} className="label-xs px-3 py-1.5 font-normal">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.data.holders.map((h) => (
                <tr
                  key={`${h.rank}-${h.address}`}
                  className="border-b border-border/50 hover:bg-surface-2"
                >
                  <td className="num px-3 py-1.5 text-[11px] text-muted-foreground">{h.rank}</td>
                  <td className="num px-3 py-1.5 text-[11px]">
                    <a
                      href={solscanAccount(h.address)}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="hover:text-primary"
                    >
                      {shortAddress(h.address, 5)}
                    </a>
                  </td>
                  <td className="num px-3 py-1.5 text-[11px]">{formatNum(h.amount)}</td>
                  <td className="num px-3 py-1.5 text-[11px] text-muted-foreground">
                    {h.share != null ? `${h.share.toFixed(2)}%` : "—"}
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
