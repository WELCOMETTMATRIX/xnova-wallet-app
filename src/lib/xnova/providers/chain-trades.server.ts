/**
 * Historical swap reconstruction straight from Solana.
 *
 * GeckoTerminal only serves trades inside a short live window; for a young or
 * quiet pool it answers with an empty list. This module rebuilds the pool's
 * most recent real swaps from confirmed signatures so the terminal can show
 * past trades instead of an empty panel. Every number here is on-chain data:
 * token amounts come from parsed balance deltas and USD value from the SOL
 * leg of the swap priced with the live pool quote.
 */
import { XNOVA } from "../config";
import type { Trade } from "../types";
import { fetchPoolMarket } from "./geckoterminal.server";
import { cachedJson } from "./http.server";
import { solanaRpc } from "./onchain.server";

interface SigResult {
  signature: string;
  blockTime: number | null;
  err: unknown;
}

interface ParsedTx {
  blockTime?: number;
  transaction?: { message?: { accountKeys?: { pubkey: string; signer?: boolean }[] } };
  meta?: {
    fee?: number;
    preBalances?: number[];
    postBalances?: number[];
    preTokenBalances?: TokenBalance[];
    postTokenBalances?: TokenBalance[];
  };
}

interface TokenBalance {
  mint: string;
  owner?: string;
  uiTokenAmount: { uiAmount: number | null };
}

async function solPriceUsd(): Promise<number | null> {
  try {
    const m = await fetchPoolMarket();
    if (m.priceUsd && m.priceNative && m.priceNative > 0) return m.priceUsd / m.priceNative;
    return null;
  } catch {
    return null;
  }
}

/** Recent pool swaps rebuilt from chain history. Newest first. */
export async function fetchChainTrades(limit = 30): Promise<Trade[]> {
  return cachedJson(`chain:trades:${limit}`, 45_000, async () => {
    const [sigs, solUsd] = await Promise.all([
      solanaRpc<SigResult[]>("getSignaturesForAddress", [
        XNOVA.primaryPair,
        { limit: Math.min(limit, 25) },
      ]),
      solPriceUsd(),
    ]);

    const ok = sigs.filter((s) => !s.err).slice(0, limit);

    const results = await Promise.all(
      ok.map(async (s): Promise<Trade | null> => {
        try {
          const tx = await solanaRpc<ParsedTx>("getTransaction", [
            s.signature,
            { maxSupportedTransactionVersion: 0, encoding: "jsonParsed" },
          ]);

          const keys = tx.transaction?.message?.accountKeys ?? [];
          const signer = keys.find((k) => k.signer)?.pubkey ?? keys[0]?.pubkey ?? "";
          if (!signer) return null;

          const pre = (tx.meta?.preTokenBalances ?? []).filter((b) => b.mint === XNOVA.tokenMint);
          const post = (tx.meta?.postTokenBalances ?? []).filter((b) => b.mint === XNOVA.tokenMint);
          if (post.length === 0) return null;

          const deltaFor = (owner: string) => {
            const before = pre.find((b) => b.owner === owner)?.uiTokenAmount.uiAmount ?? 0;
            const after = post.find((b) => b.owner === owner)?.uiTokenAmount.uiAmount ?? 0;
            return after - before;
          };

          let trader = signer;
          let tokenDelta = deltaFor(signer);

          if (Math.abs(tokenDelta) < 1e-9) {
            // Router or PDA-owned trade: take the largest non-pool balance move.
            const moves = post
              .map((b) => ({ owner: b.owner ?? "", delta: deltaFor(b.owner ?? "") }))
              .filter((m) => m.owner && m.owner !== XNOVA.primaryPair && Math.abs(m.delta) > 1e-9)
              .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
            const top = moves[0];
            if (!top) return null;
            trader = top.owner;
            tokenDelta = top.delta;
          }

          const kind: Trade["kind"] = tokenDelta > 0 ? "buy" : "sell";
          const amountToken = Math.abs(tokenDelta);

          // SOL leg of the swap for the signer, fee excluded.
          const idx = keys.findIndex((k) => k.pubkey === signer);
          const preLamports = tx.meta?.preBalances?.[idx] ?? null;
          const postLamports = tx.meta?.postBalances?.[idx] ?? null;
          let valueUsd = 0;
          if (preLamports != null && postLamports != null && solUsd) {
            const lamports = Math.abs(postLamports - preLamports + (tx.meta?.fee ?? 0));
            valueUsd = (lamports / 1e9) * solUsd;
          }

          return {
            id: s.signature,
            kind,
            priceUsd: amountToken > 0 && valueUsd > 0 ? valueUsd / amountToken : 0,
            amountToken,
            valueUsd,
            wallet: trader,
            txHash: s.signature,
            timestamp: (tx.blockTime ?? s.blockTime ?? 0) * 1000,
          } satisfies Trade;
        } catch {
          return null;
        }
      }),
    );

    const trades = results
      .filter((t): t is Trade => t !== null && t.amountToken > 0)
      .sort((a, b) => b.timestamp - a.timestamp);

    if (trades.length === 0) throw new Error("No swaps found in the recent chain window");
    return trades;
  });
}
