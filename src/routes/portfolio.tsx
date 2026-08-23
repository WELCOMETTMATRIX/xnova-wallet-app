import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useState } from "react";

import { TerminalLayout } from "@/components/xnova/Layout";
import { Loading, Panel, Stat, Unavailable } from "@/components/xnova/primitives";
import { XNOVA, formatNum, formatUsd, shortAddress, solscanAccount } from "@/lib/xnova/config";
import { marketQuery } from "@/lib/xnova/queries";
import { getSolPrice, getWalletPortfolio } from "@/lib/xnova/wallet.functions";

export const Route = createFileRoute("/portfolio")({
  head: () => ({
    meta: [
      { title: "XNOVA Portfolio — Solana Wallet Holdings" },
      {
        name: "description",
        content:
          "Inspect any Solana wallet: SOL balance, XNOVA holdings, SPL tokens and allocation, priced with live market data.",
      },
      { property: "og:title", content: "XNOVA Portfolio — Solana Wallet Holdings" },
      {
        property: "og:description",
        content: "Non-custodial Solana portfolio view with live SOL and XNOVA valuation.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Portfolio,
});

function Portfolio() {
  const [input, setInput] = useState("");
  const [address, setAddress] = useState("");

  const portfolio = useQuery({
    queryKey: ["xnova", "portfolio", address],
    queryFn: () => getWalletPortfolio({ data: { address } }),
    enabled: address.length >= 32,
    refetchInterval: 60_000,
  });
  const solPrice = useQuery({
    queryKey: ["xnova", "sol-price"],
    queryFn: () => getSolPrice(),
    refetchInterval: 60_000,
  });
  const market = useQuery(marketQuery());

  const p = portfolio.data?.ok ? portfolio.data.data : null;
  const sol = solPrice.data?.ok ? solPrice.data.data.usd : null;
  const xnovaPrice = market.data?.ok ? market.data.data.priceUsd : null;
  const solValue = p && sol != null ? p.solBalance * sol : null;
  const xnovaValue = p && xnovaPrice != null ? (p.xnovaBalance ?? 0) * xnovaPrice : null;
  const total = solValue != null || xnovaValue != null ? (solValue ?? 0) + (xnovaValue ?? 0) : null;

  return (
    <TerminalLayout>
      <div className="space-y-4">
        <header className="panel px-4 py-4">
          <h1 className="text-lg font-semibold tracking-tight">PORTFOLIO</h1>
          <p className="mt-1 max-w-2xl text-[11px] leading-relaxed text-muted-foreground">
            Read-only wallet inspection over Solana RPC. XNOVA never asks for a seed phrase or private
            key and cannot move your funds. Connect an EVM wallet (MetaMask, Crypto.com Onchain) from
            the header, or inspect any Solana address below.
          </p>
        </header>

        <Panel title="SOLANA WALLET LOOKUP">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setAddress(input.trim());
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
              Load portfolio
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
                  <Stat label="Total value" value={formatUsd(total)} sub="SOL + XNOVA priced live" />
                  <Stat label="SOL" value={formatNum(p?.solBalance ?? null)} sub={formatUsd(solValue)} />
                  <Stat label="XNOVA" value={formatNum(p?.xnovaBalance ?? null)} sub={formatUsd(xnovaValue)} />
                  <Stat label="SPL tokens" value={formatNum(p?.tokens.length ?? null)} />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-border">
                        {["Mint", "Amount", "Decimals"].map((h) => (
                          <th key={h} className="label-xs px-2 py-1.5 font-normal">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(p?.tokens ?? []).slice(0, 40).map((t) => (
                        <tr key={t.mint} className="border-b border-border/50 hover:bg-surface-2">
                          <td className="num px-2 py-1.5 text-[11px]">
                            <a
                              href={`https://solscan.io/token/${t.mint}`}
                              target="_blank"
                              rel="noopener noreferrer nofollow"
                              className="hover:text-primary"
                            >
                              {t.mint === XNOVA.tokenMint ? "XNOVA" : shortAddress(t.mint, 6)}
                            </a>
                          </td>
                          <td className="num px-2 py-1.5 text-[11px]">{formatNum(t.amount)}</td>
                          <td className="num px-2 py-1.5 text-[11px] text-muted-foreground">{t.decimals}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  PnL is intentionally omitted: cost-basis history is not available from these data
                  sources, and XNOVA does not display estimated numbers.
                </p>
              </div>
            )}
          </Panel>
        ) : null}
      </div>
    </TerminalLayout>
  );
}
