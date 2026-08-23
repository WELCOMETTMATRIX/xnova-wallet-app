import type { MarketSnapshot } from "../types";
import { fetchMarketSnapshot } from "./dexscreener.server";
import { fetchPoolMarket } from "./geckoterminal.server";

/**
 * Market snapshot with provider fallback.
 * DexScreener is primary; newly launched or thinly indexed pools are often missing there,
 * in which case GeckoTerminal's pool endpoint serves the same fields.
 */
export async function fetchMarket(): Promise<MarketSnapshot> {
  try {
    return await fetchMarketSnapshot();
  } catch (dexError) {
    try {
      return await fetchPoolMarket();
    } catch {
      throw dexError instanceof Error ? dexError : new Error("Market data unavailable");
    }
  }
}
