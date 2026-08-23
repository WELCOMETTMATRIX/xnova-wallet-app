import type { MarketSnapshot } from "../types";
import { fetchMarketSnapshot } from "./dexscreener.server";
import { fetchPoolMarket } from "./geckoterminal.server";

/**
 * Market snapshot with provider fallback.
 *
 * DexScreener is primary. Newly launched or thinly indexed pools are often absent there,
 * so GeckoTerminal's pool endpoint supplies the same fields. A DexScreener miss is cached
 * for a cooldown window so the terminal does not re-issue a request that is known to fail.
 */
const DEX_COOLDOWN_MS = 5 * 60_000;
let dexUnavailableUntil = 0;

export async function fetchMarket(): Promise<MarketSnapshot> {
  if (Date.now() > dexUnavailableUntil) {
    try {
      return await fetchMarketSnapshot();
    } catch {
      dexUnavailableUntil = Date.now() + DEX_COOLDOWN_MS;
    }
  }
  return fetchPoolMarket();
}
