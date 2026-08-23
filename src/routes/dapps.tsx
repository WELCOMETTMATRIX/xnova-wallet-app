import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, ExternalLink, Search, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";

import { TerminalLayout } from "@/components/xnova/Layout";
import { Panel } from "@/components/xnova/primitives";
import { CATEGORIES, DAPPS, inspectUrl, type DappCategory } from "@/lib/xnova/dapps";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dapps")({
  head: () => ({
    meta: [
      { title: "XNOVA dApp Explorer — Discover Solana Applications" },
      {
        name: "description",
        content:
          "Search and filter Solana dApps by category: DEX, DeFi, NFT, gaming, staking, lending, infrastructure and more, with outbound link safety checks.",
      },
      { property: "og:title", content: "XNOVA dApp Explorer — Discover Solana Applications" },
      {
        property: "og:description",
        content: "Curated, searchable registry of Solana dApps with basic link security metadata.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dapps,
});

function Dapps() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<DappCategory | "All">("All");
  const [trendingOnly, setTrendingOnly] = useState(false);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DAPPS.filter((d) => {
      if (category !== "All" && d.category !== category) return false;
      if (trendingOnly && !d.trending) return false;
      if (!q) return true;
      return (
        d.name.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q)
      );
    });
  }, [query, category, trendingOnly]);

  return (
    <TerminalLayout>
      <div className="space-y-4">
        <header className="panel px-4 py-4">
          <h1 className="text-lg font-semibold tracking-tight">XNOVA dAPP EXPLORER</h1>
          <p className="mt-1 max-w-2xl text-[11px] leading-relaxed text-muted-foreground">
            A curated registry of Solana applications. Listing is not an endorsement. Never enter your
            seed phrase into a website and never sign a transaction you do not understand.
          </p>
        </header>

        <div className="panel flex flex-col gap-3 p-3">
          <div className="flex items-center gap-2 rounded-sm border border-border bg-background px-3 py-2">
            <Search className="size-4 text-muted-foreground" aria-hidden />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search dApps, categories, keywords"
              className="num w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              aria-label="Search dApps"
            />
          </div>
          <div className="flex flex-wrap gap-1">
            {(["All", ...CATEGORIES] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c as DappCategory | "All")}
                className={cn(
                  "num rounded-sm px-2.5 py-1 text-[11px] uppercase tracking-widest transition-colors",
                  category === c
                    ? "bg-primary text-primary-foreground"
                    : "border border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {c}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setTrendingOnly((v) => !v)}
              className={cn(
                "num rounded-sm px-2.5 py-1 text-[11px] uppercase tracking-widest transition-colors",
                trendingOnly
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-muted-foreground hover:text-foreground",
              )}
            >
              Trending
            </button>
          </div>
        </div>

        <Panel title={`RESULTS · ${results.length}`}>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {results.map((d) => {
              const safety = inspectUrl(d.url);
              return (
                <article
                  key={d.name}
                  className="flex flex-col rounded-sm border border-border bg-surface-2/40 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={`https://www.google.com/s2/favicons?sz=64&domain=${safety.host}`}
                        alt={`${d.name} logo`}
                        width={28}
                        height={28}
                        loading="lazy"
                        className="size-7 rounded-sm border border-border bg-background object-contain p-1"
                      />
                      <div>
                        <h2 className="text-sm font-medium">{d.name}</h2>
                        <span className="label-xs">{d.category}</span>
                      </div>
                    </div>
                    {d.trending ? (
                      <span className="num rounded-sm border border-primary/50 px-1.5 py-0.5 text-[10px] uppercase tracking-widest text-primary">
                        Trending
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 flex-1 text-[11px] leading-relaxed text-muted-foreground">
                    {d.description}
                  </p>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        "num inline-flex items-center gap-1 text-[10px] uppercase tracking-widest",
                        safety.suspicious ? "text-warn" : "text-bull",
                      )}
                      title={safety.reasons.join(", ") || "HTTPS · known host"}
                    >
                      {safety.suspicious ? (
                        <AlertTriangle className="size-3" />
                      ) : (
                        <ShieldCheck className="size-3" />
                      )}
                      {safety.host}
                    </span>
                    <div className="flex items-center gap-1">
                      {d.twitter ? (
                        <a
                          href={d.twitter}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="num rounded-sm border border-border px-2 py-1 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground"
                        >
                          X
                        </a>
                      ) : null}
                      <a
                        href={d.url}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="num inline-flex items-center gap-1 rounded-sm border border-border px-2 py-1 text-[10px] uppercase tracking-widest text-muted-foreground hover:border-primary hover:text-foreground"
                      >
                        Open <ExternalLink className="size-3" />
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
            {results.length === 0 ? (
              <p className="col-span-full py-8 text-center text-sm text-muted-foreground">
                No dApps match this filter.
              </p>
            ) : null}
          </div>
        </Panel>
      </div>
    </TerminalLayout>
  );
}
