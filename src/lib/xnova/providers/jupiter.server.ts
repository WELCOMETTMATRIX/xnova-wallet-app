import { XNOVA } from "../config";
import type { MarketSnapshot } from "../types";
import { cachedJson, getJson } from "./http.server";

interface JupPrice {
  usdPrice?: number;
  liquidity?: number;
  decimals?: number;
}

/**
 * Last-resort price source. Jupiter's lite price API indexes pump.fun pools
 * immediately, so it answers even when aggregators have not indexed the pair.
 */
export async function fetchJupiterMarket(): Promise<MarketSnapshot> {
  return cachedJson("jup:price", 30_000, async () => {
    const payload = await getJson<Record<string, JupPrice>>(
      `https://lite-api.jup.ag/price/v3?ids=${XNOVA.tokenMint}`,
    );
    const entry = payload[XNOVA.tokenMint];
    const price = typeof entry?.usdPrice === "number" ? entry.usdPrice : null;
    if (price == null) throw new Error("No Jupiter price for token");
    const supply = 1_000_000_000;

    return {
      priceUsd: price,
      priceNative: null,
      change: { m5: null, h1: null, h6: null, h24: null },
      volume24h: null,
      liquidityUsd: typeof entry?.liquidity === "number" ? entry.liquidity : null,
      fdv: price * supply,
      marketCap: price * supply,
      txns24h: { buys: null, sells: null },
      pairAddress: XNOVA.primaryPair,
      dexId: "pump-fun",
      baseSymbol: "XNOVA",
      baseName: "XNOVA",
      quoteSymbol: "SOL",
      pairCreatedAt: null,
    } satisfies MarketSnapshot;
  });
}
