import type { MarketSnapshot } from "../types";
import { fetchMarketSnapshot } from "./dexscreener.server";
import { fetchJupiterMarket } from "./jupiter.server";

/**
 * Market snapshot with provider fallback.
 *
 * DexScreener is the primary no-key market source. Jupiter is kept only as a
 * no-key fallback for a minimal price snapshot if DexScreener is temporarily unavailable.
 * GeckoTerminal is intentionally not used here to avoid its public API rate limits.
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
    return await fetchJupiterMarket();
  } catch (error) {
    errors.push(`jupiter: ${(error as Error).message}`);
  }

  throw new Error(`No market provider responded (${errors.join(" | ")})`);
}
