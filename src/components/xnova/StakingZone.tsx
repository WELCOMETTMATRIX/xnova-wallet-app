import { ExternalLink, Lock } from "lucide-react";

import { XNOVA } from "@/lib/xnova/config";
import { Panel } from "./primitives";

const VENUES = [
  {
    name: "Marinade",
    url: "https://marinade.finance",
    body: "Liquid stake SOL for mSOL and keep it usable across DeFi.",
  },
  {
    name: "Jito",
    url: "https://www.jito.network",
    body: "MEV-boosted liquid staking with JitoSOL.",
  },
  {
    name: "Sanctum",
    url: "https://app.sanctum.so",
    body: "Route between liquid staking tokens with deep liquidity.",
  },
  {
    name: "Native delegation",
    url: "https://solanabeach.io/validators",
    body: "Delegate SOL directly to a validator from your wallet.",
  },
];

export function StakingZone() {
  return (
    <Panel
      title="STAKING ZONE"
      action={<span className="label-xs">Solana Mainnet</span>}
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
        <div className="rounded-sm border border-primary/30 bg-primary/5 p-4">
          <div className="flex items-center justify-between gap-2">
            <Lock className="size-4 text-primary" aria-hidden />
            <span className="num rounded-sm border border-primary/50 bg-primary/10 px-2 py-0.5 text-[10px] uppercase tracking-widest text-primary">
              Coming soon
            </span>
          </div>
          <h3 className="mt-2 text-sm font-medium">XNOVA staking</h3>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            XNOVA staking is coming soon. No staking program is deployed on-chain yet, so no APY or
            rewards are shown here. When the staking contract ships, this panel reads its live
            on-chain state — the terminal never displays estimated or placeholder yields.
          </p>
          <a
            href={XNOVA.links.solscan}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="num mt-3 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-primary hover:underline"
          >
            Verify token on Solscan <ExternalLink className="size-3" />
          </a>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {VENUES.map((v) => (
            <a
              key={v.name}
              href={v.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="rounded-sm border border-border bg-surface-2/40 p-3 transition-colors hover:border-primary/60"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{v.name}</span>
                <ExternalLink className="size-3 text-muted-foreground" aria-hidden />
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{v.body}</p>
            </a>
          ))}
        </div>
      </div>
    </Panel>
  );
}
