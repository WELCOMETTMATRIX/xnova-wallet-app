import { ExternalLink } from "lucide-react";

import { XNOVA } from "@/lib/xnova/config";

const DEXSCREENER_EMBED = `${XNOVA.links.dexscreener}?embed=1&theme=dark&trades=0&info=0`;

export function PriceChart() {
  return (
    <div className="panel flex h-[420px] flex-col overflow-hidden sm:h-[520px]">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
        <div className="flex items-center gap-2">
          <h2 className="label-xs">XNOVA / SOL · DEXSCREENER CHART</h2>
        </div>
        <a
          href={XNOVA.links.dexscreener}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="inline-flex items-center gap-1 rounded-sm border border-border px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/60 hover:text-primary"
        >
          Open DexScreener <ExternalLink className="size-3" />
        </a>
      </header>
      <iframe
        title="XNOVA DexScreener chart"
        src={DEXSCREENER_EMBED}
        className="min-h-0 flex-1 border-0 bg-background"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allow="clipboard-write"
      />
    </div>
  );
}
