/**
 * Provider resolution: prefer Solscan Pro when the configured key covers the
 * endpoint, otherwise fall back to free Solana RPC + DexScreener data.
 */
import type { Holder, TokenMeta, Transfer } from "../types";
import { fetchChainTokenMeta, fetchChainTopHolders, fetchChainTransfers } from "./onchain.server";
import {
  fetchTokenMeta,
  fetchTopHolders,
  fetchTransfers,
  solscanConfigured,
} from "./solscan.server";

async function withFallback<T>(primary: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
  if (!solscanConfigured()) return fallback();
  try {
    return await primary();
  } catch (error) {
    console.warn("[xnova] solscan unavailable, using chain fallback:", (error as Error).message);
    return fallback();
  }
}

export function fetchTokenMetaResilient(): Promise<TokenMeta> {
  return withFallback(fetchTokenMeta, fetchChainTokenMeta);
}

export function fetchHoldersResilient(
  limit: number,
): Promise<{ holders: Holder[]; total: number | null }> {
  return withFallback(
    () => fetchTopHolders(limit),
    () => fetchChainTopHolders(limit),
  );
}

export function fetchTransfersResilient(limit: number): Promise<Transfer[]> {
  return withFallback(
    () => fetchTransfers(limit),
    () => fetchChainTransfers(limit),
  );
}
