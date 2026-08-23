import { XNOVA } from "../config";
import type { MarketSnapshot } from "../types";
import { cachedJson, getJson } from "./http.server";

interface DsPair {
  chainId: string;
  dexId?: string;
  pairAddress: string;
  baseToken?: { address: string; name?: string; symbol?: string };
  quoteToken?: { symbol?: string };
  priceUsd?: string;
  priceNative?: string;
  txns?: Record<string, { buys?: number; sells?: number }>;
  volume?: Record<string, number>;
  priceChange?: Record<string, number>;
  liquidity?: { usd?: number };
  fdv?: number;
  marketCap?: number;
  pairCreatedAt?: number;
}

const num = (v: unknown): number | null => {
  const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? n : null;
};

/** Live market data from DexScreener (public API, no credentials required). */
export async function fetchMarketSnapshot(): Promise<MarketSnapshot> {
  return cachedJson("ds:market", 60_000, async () => {
    const payload = await getJson<{ pairs: DsPair[] | null }>(
      `https://api.dexscreener.com/latest/dex/tokens/${XNOVA.tokenMint}`,
    );
    const pairs = payload.pairs ?? [];
    if (pairs.length === 0) throw new Error("No DexScreener pairs for token");
    const sorted = [...pairs].sort(
      (a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0),
    );
    const pair: DsPair =
      pairs.find((p) => p.pairAddress === XNOVA.primaryPair) ?? sorted[0] ?? pairs[0]!;

    return {
      priceUsd: num(pair.priceUsd),
      priceNative: num(pair.priceNative),
      change: {
        m5: num(pair.priceChange?.["m5"]),
        h1: num(pair.priceChange?.["h1"]),
        h6: num(pair.priceChange?.["h6"]),
        h24: num(pair.priceChange?.["h24"]),
      },
      volume24h: num(pair.volume?.["h24"]),
      liquidityUsd: num(pair.liquidity?.usd),
      fdv: num(pair.fdv),
      marketCap: num(pair.marketCap ?? pair.fdv),
      txns24h: {
        buys: num(pair.txns?.["h24"]?.buys),
        sells: num(pair.txns?.["h24"]?.sells),
      },
      pairAddress: pair.pairAddress,
      dexId: pair.dexId ?? null,
      baseSymbol: pair.baseToken?.symbol ?? null,
      baseName: pair.baseToken?.name ?? null,
      quoteSymbol: pair.quoteToken?.symbol ?? null,
      pairCreatedAt: pair.pairCreatedAt ?? null,
    } satisfies MarketSnapshot;
  });
}
