import { createFileRoute } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, Wallet } from "lucide-react";
import { useEffect, useState } from "react";

import { TerminalLayout } from "@/components/xnova/Layout";
import { BrandLogo } from "@/components/xnova/BrandLogo";
import { Loading, Panel, Stat, Unavailable } from "@/components/xnova/primitives";
import { XNOVA, formatNum, formatUsd, shortAddress, solscanAccount } from "@/lib/xnova/config";
import { getWalletPortfolio } from "@/lib/xnova/wallet.functions";
import {
  loadSavedSolanaAddress,
  saveSolanaAddress,
  useConnectedWallet,
} from "@/lib/xnova/wallet-store";

export const Route = createFileRoute("/portfolio")({
  head: () => ({
    meta: [
      { title: "XNOVA Portfolio — Live Wallet Balances" },
      {
        name: "description",
        content:
          "Live balances for your connected wallet plus any Solana address: SOL, XNOVA and every SPL holding priced with real market data.",
      },
      { property: "og:title", content: "XNOVA Portfolio — Live Wallet Balances" },
      {
        property: "og:description",
        content: "Non-custodial portfolio view with live SOL, XNOVA and SPL token valuation.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Portfolio,
});

function Portfolio() {
  const connected = useConnectedWallet();
  const [input, setInput] = useState("");
  const [address, setAddress] = useState("");

  // Restore the last inspected Solana address after hydration.
  useEffect(() => {
    const saved = loadSavedSolanaAddress();
    if (saved) {
      setInput(saved);
      setAddress(saved);
    }
  }, []);

  useEffect(() => {
    if (!connected.address) return;
    setInput(connected.address);
    setAddress(connected.address);
  }, [connected.address]);

  const portfolio = useQuery({
    queryKey: ["xnova", "portfolio", address],
    queryFn: () => getWalletPortfolio({ data: { address } }),
    enabled: address.length >= 32,
    refetchInterval: 60_000,
  });

  const p = portfolio.data?.ok ? portfolio.data.data : null;

  return (
    <TerminalLayout>
      <div className="space-y-4">
        <header className="panel px-4 py-4">
          <h1 className="text-lg font-semibold tracking-tight">PORTFOLIO</h1>
          <p className="mt-1 max-w-2xl text-[11px] leading-relaxed text-muted-foreground">
            Live balances only — every number here is read from chain RPC and priced against live
            market data. XNOVA never asks for a seed phrase or private key and cannot move funds.
          </p>
        </header>

        <Panel
          title="CONNECTED ACCOUNT"
          action={<span className="label-xs">{connected.address ? "LIVE" : "NOT CONNECTED"}</span>}
        >
          {connected.address ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Stat label="Account" value={shortAddress(connected.address, 6)} sub={connected.walletName ?? "Solana wallet"} />
              <Stat label="Network" value="Solana" sub="Mainnet" />
              <Stat label="Portfolio" value="Synced" sub="Balances shown below" />
            </div>
          ) : (
            <div className="flex items-center gap-3 py-4 text-[11px] text-muted-foreground">
              <Wallet className="size-4" aria-hidden />
              Connect Phantom, Solflare, Backpack, or Crypto.com Onchain from the header. Your SOL,
              XNOVA, and SPL token balances will load automatically below.
            </div>
          )}
        </Panel>

        <Panel title="SOLANA WALLET">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const next = input.trim();
              setAddress(next);
              if (next) saveSolanaAddress(next);
            }}
            className="flex flex-col gap-2 sm:flex-row"
          >
            <div className="flex flex-1 items-center gap-2 rounded-sm border border-border bg-background px-3 py-2">
              <Search className="size-4 text-muted-foreground" aria-hidden />
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Solana wallet address"
                className="num w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                aria-label="Solana wallet address"
              />
            </div>
            <button
              type="submit"
              className="num rounded-sm bg-primary px-4 py-2 text-[11px] uppercase tracking-widest text-primary-foreground"
            >
              Load balances
            </button>
          </form>
        </Panel>

        {address ? (
          <Panel
            title={`HOLDINGS · ${shortAddress(address, 6)}`}
            action={
              <a
                href={solscanAccount(address)}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="label-xs hover:text-foreground"
              >
                Solscan
              </a>
            }
          >
            {portfolio.isPending ? (
              <Loading label="Reading on-chain balances" />
            ) : !portfolio.data?.ok ? (
              <Unavailable source="Solana RPC" detail={portfolio.data?.error} />
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <Stat
                    label="Total value"
                    value={formatUsd(p?.totalValueUsd ?? null)}
                    sub={`${p?.pricedCount ?? 0} priced assets`}
                  />
                  <Stat
                    label="SOL"
                    value={formatNum(p?.solBalance ?? null)}
                    sub={formatUsd(p?.solValueUsd ?? null)}
                  />
                  <Stat
                    label="XNOVA"
                    value={formatNum(p?.xnovaBalance ?? null)}
                    sub={p?.xnovaValueUsd != null ? formatUsd(p.xnovaValueUsd) : "No live pair"}
                  />

                  <Stat label="SPL tokens" value={formatNum(p?.tokens.length ?? null)} />
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-border">
                        {["Asset", "Amount", "Price", "Value", "Weight"].map((h) => (
                          <th key={h} className="label-xs px-2 py-1.5 font-normal">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(p?.tokens ?? []).slice(0, 50).map((t) => {
                        const weight =
                          p?.totalValueUsd && t.valueUsd != null && p.totalValueUsd > 0
                            ? (t.valueUsd / p.totalValueUsd) * 100
                            : null;
                        const isXnova = t.mint === XNOVA.tokenMint;
                        return (
                          <tr key={t.mint} className="border-b border-border/50 hover:bg-surface-2">
                            <td className="px-2 py-1.5">
                              <a
                                href={`https://solscan.io/token/${t.mint}`}
                                target="_blank"
                                rel="noopener noreferrer nofollow"
                                className="flex items-center gap-2 hover:text-primary"
                              >
                                <BrandLogo
                                  name={t.symbol ?? t.mint}
                                  icon={t.icon}
                                  className="size-5"
                                />
                                <span className="num text-[11px]">
                                  {isXnova ? "XNOVA" : (t.symbol ?? shortAddress(t.mint, 5))}
                                </span>
                              </a>
                            </td>
                            <td className="num px-2 py-1.5 text-[11px]">{formatNum(t.amount)}</td>
                            <td className="num px-2 py-1.5 text-[11px] text-muted-foreground">
                              {t.priceUsd != null ? formatUsd(t.priceUsd, 6) : "—"}
                            </td>
                            <td className="num px-2 py-1.5 text-[11px]">
                              {t.valueUsd != null ? formatUsd(t.valueUsd) : "—"}
                            </td>
                            <td className="num px-2 py-1.5 text-[11px] text-muted-foreground">
                              {weight != null ? `${weight.toFixed(1)}%` : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <p className="text-[11px] text-muted-foreground">
                  Assets without a live market pair show “—” instead of an estimated price. PnL is
                  omitted: cost-basis history is not available from these data sources.
                </p>
              </div>
            )}
          </Panel>
        ) : null}
      </div>
    </TerminalLayout>
  );
}
