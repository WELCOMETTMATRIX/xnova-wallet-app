/**
 * XNOVA — static, public project configuration.
 * Contains no secrets. Safe to import from client code.
 */

export const XNOVA = {
  name: "XNOVA",
  subtitle: "SOLANA WEB3 INTELLIGENCE TERMINAL",
  network: "SOLANA MAINNET",
  tokenMint: "9RwukCBfqoXb4XaqDvchKs8LhSmbbdcVik1S9h47pump",
  primaryPair: "6XwPJSsCvHpMaiGZstCbm95RmBMQMZpErRYSXfsPyNhT",
  website: "https://xnovasolanax.vercel.app/",
  links: {
    dexscreener:
      "https://dexscreener.com/solana/9RwukCBfqoXb4XaqDvchKs8LhSmbbdcVik1S9h47pump",
    pumpfun:
      "https://pump.fun/coin/9RwukCBfqoXb4XaqDvchKs8LhSmbbdcVik1S9h47pump?clip=20260822_060828%3A2485098_20260822_060800",
    solscan:
      "https://solscan.io/token/9RwukCBfqoXb4XaqDvchKs8LhSmbbdcVik1S9h47pump",
    geckoterminal:
      "https://www.geckoterminal.com/solana/pools/6XwPJSsCvHpMaiGZstCbm95RmBMQMZpErRYSXfsPyNhT",
    twitter: "https://x.com/XNOVASOLANA",
    github: "https://github.com/xnova-solana",
    telegram: "https://t.me/",
  },
} as const;

export const TELEGRAM_ICON = "https://assets.lovable.dev/img/connectors/telegram.svg";

export function solscanTx(signature: string) {
  return `https://solscan.io/tx/${signature}`;
}

export function solscanAccount(address: string) {
  return `https://solscan.io/account/${address}`;
}

export function shortAddress(address: string, size = 4) {
  if (!address || address.length <= size * 2 + 3) return address;
  return `${address.slice(0, size)}...${address.slice(-size)}`;
}

export const TIMEFRAMES = [
  { label: "1m", timeframe: "minute", aggregate: 1 },
  { label: "5m", timeframe: "minute", aggregate: 5 },
  { label: "15m", timeframe: "minute", aggregate: 15 },
  { label: "1H", timeframe: "hour", aggregate: 1 },
  { label: "4H", timeframe: "hour", aggregate: 4 },
  { label: "1D", timeframe: "day", aggregate: 1 },
  { label: "1W", timeframe: "day", aggregate: 7 },
] as const;

export type TimeframeLabel = (typeof TIMEFRAMES)[number]["label"];

export function formatUsd(value: number | null | undefined, maxFrac = 2): string {
  if (value == null || !Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;
  if (abs > 0 && abs < 0.01)
    return `$${value.toFixed(Math.min(10, Math.max(4, -Math.floor(Math.log10(abs)) + 3)))}`;
  return `$${value.toFixed(maxFrac)}`;
}

export function formatNum(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(2)}K`;
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

export function formatPct(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export function timeAgo(ts: number): string {
  const seconds = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
