export type DataResult<T> =
  | { ok: true; data: T; source: string; fetchedAt: number }
  | { ok: false; error: string; source: string; fetchedAt: number };

export interface MarketSnapshot {
  priceUsd: number | null;
  priceNative: number | null;
  change: { m5: number | null; h1: number | null; h6: number | null; h24: number | null };
  volume24h: number | null;
  liquidityUsd: number | null;
  fdv: number | null;
  marketCap: number | null;
  txns24h: { buys: number | null; sells: number | null };
  pairAddress: string;
  dexId: string | null;
  baseSymbol: string | null;
  baseName: string | null;
  quoteSymbol: string | null;
  pairCreatedAt: number | null;
}

export interface Candle {
  time: number; // unix seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Trade {
  id: string;
  kind: "buy" | "sell";
  priceUsd: number;
  amountToken: number;
  valueUsd: number;
  wallet: string;
  txHash: string | null;
  timestamp: number; // ms
}

export interface Holder {
  address: string;
  amount: number;
  decimals: number;
  rank: number;
  share: number | null;
}

export interface TokenMeta {
  address: string;
  name: string | null;
  symbol: string | null;
  decimals: number | null;
  supply: number | null;
  holders: number | null;
  icon: string | null;
}

export interface Transfer {
  signature: string;
  from: string;
  to: string;
  amount: number;
  timestamp: number; // ms
}
