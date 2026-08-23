import type { MarketSnapshot } from "../types";
import { fetchMarketSnapshot } from "./dexscreener.server";
import { fetchPoolMarket } from "./geckoterminal.server";
import { fetchJupiterMarket } from "./jupiter.server";

/**
 * Market snapshot with provider fallback.
 *
 * DexScreener is primary. Newly launched or thinly indexed pools are often absent there,
 * so GeckoTerminal's pool endpoint supplies the same fields, and Jupiter's price API acts
 * as a final source that always answers for pump.fun mints. A DexScreener miss is cached
 * for a cooldown window so the terminal does not re-issue a request that is known to fail.
 */
const DEX_COOLDOWN_MS = 5 * 60_000;
let dexUnavailableUntil = 0;

export async function fetchMarket(): Promise<MarketSnapshot> {
  const errors: string[] = [];

  if (Date.now() > dexUnavailableUntil) {
    try {
      return await fetchMarketSnapshot();
    } catch (error) {
      dexUnavailableUntil = Date.now() + DEX_COOLDOWN_MS;
      errors.push(`dexscreener: ${(error as Error).message}`);
    }
  }

  try {
    return await fetchPoolMarket();
  } catch (error) {
    errors.push(`geckoterminal: ${(error as Error).message}`);
  }

  try {
    return await fetchJupiterMarket();
  } catch (error) {
    errors.push(`jupiter: ${(error as Error).message}`);
  }

  throw new Error(`No market provider responded (${errors.join(" | ")})`);
}
