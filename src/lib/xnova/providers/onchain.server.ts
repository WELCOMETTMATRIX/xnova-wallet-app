/**
 * Free on-chain fallbacks (Solana JSON-RPC + DexScreener).
 *
 * Used when the Solscan Pro key is missing or its tier does not cover an
 * endpoint. Everything here is real chain data — no estimated values.
 */
import { XNOVA } from "../config";
import { solanaRpcUrls } from "../env.server";
import type { Holder, TokenMeta, Transfer } from "../types";
import { cachedJson, getJson } from "./http.server";

export async function solanaRpc<T>(method: string, params: unknown[]): Promise<T> {
  let lastError: unknown;
  for (const url of solanaRpcUrls()) {
    try {
      const payload = await getJson<{ result?: T; error?: { message?: string } }>(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
        retries: 1,
        timeoutMs: 12_000,
      });
      if (payload.error) throw new Error(payload.error.message ?? "Solana RPC error");
      if (payload.result === undefined) throw new Error("Empty Solana RPC result");
      return payload.result;
    } catch (error) {
      console.warn(`[xnova:rpc] ${method} failed on ${new URL(url).host}: ${(error as Error).message.slice(0, 120)}`);
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Solana RPC unavailable");
}

interface SupplyResult {
  value: { amount: string; decimals: number; uiAmount: number | null };
}

/** Token supply + decimals from chain, symbol/name/icon from the live market pair. */
export async function fetchChainTokenMeta(): Promise<TokenMeta> {
  return cachedJson("chain:meta", 120_000, async () => {
    const supply = await solanaRpc<SupplyResult>("getTokenSupply", [XNOVA.tokenMint]);
    let symbol: string | null = null;
    let name: string | null = null;
    let icon: string | null = null;
    try {
      const ds = await getJson<{
        pairs?: { baseToken?: { symbol?: string; name?: string }; info?: { imageUrl?: string } }[];
      }>(`https://api.dexscreener.com/latest/dex/tokens/${XNOVA.tokenMint}`);
      const pair = ds.pairs?.[0];
      symbol = pair?.baseToken?.symbol ?? null;
      name = pair?.baseToken?.name ?? null;
      icon = pair?.info?.imageUrl ?? null;
    } catch {
      /* metadata is optional */
    }
    return {
      address: XNOVA.tokenMint,
      name,
      symbol,
      decimals: supply.value.decimals,
      supply: supply.value.uiAmount ?? Number(supply.value.amount) / 10 ** supply.value.decimals,
      holders: null,
      icon,
    } satisfies TokenMeta;
  });
}

interface LargestResult {
  value: { address: string; amount: string; decimals: number; uiAmount: number | null }[];
}

/** Top token accounts from chain, resolved to their owner wallets. */
export async function fetchChainTopHolders(
  limit = 20,
): Promise<{ holders: Holder[]; total: number | null }> {
  return cachedJson(`chain:holders:${limit}`, 120_000, async () => {
    const largest = await solanaRpc<LargestResult>("getTokenLargestAccounts", [XNOVA.tokenMint]);
    const accounts = (largest.value ?? []).slice(0, limit);

    let supply: number | null = null;
    try {
      supply = (await fetchChainTokenMeta()).supply;
    } catch {
      supply = null;
    }

    const owners: string[] = [];
    for (const a of accounts) {
      owners.push(
        await (async () => {
        try {
          const info = await solanaRpc<{
            value: { data: { parsed: { info: { owner?: string } } } } | null;
          }>("getAccountInfo", [a.address, { encoding: "jsonParsed" }]);
          return info.value?.data?.parsed?.info?.owner ?? a.address;
        } catch {
          return a.address;
        }
        })(),
      );
    }

    const holders: Holder[] = accounts.map((a, i) => {
      const amount = a.uiAmount ?? Number(a.amount) / 10 ** a.decimals;
      return {
        address: owners[i] ?? a.address,
        amount,
        decimals: a.decimals,
        rank: i + 1,
        share: supply && supply > 0 ? (amount / supply) * 100 : null,
      };
    });

    return { holders, total: null };
  });
}

interface SigResult {
  signature: string;
  blockTime: number | null;
  err: unknown;
}

/**
 * Recent on-chain transfers derived from the pool's confirmed signatures and
 * parsed token balance deltas. Only fully parsed transfers are returned.
 */
export async function fetchChainTransfers(limit = 20): Promise<Transfer[]> {
  return cachedJson(`chain:transfers:${limit}`, 45_000, async () => {
    const sigs = await solanaRpc<SigResult[]>("getSignaturesForAddress", [
      XNOVA.primaryPair,
      { limit: Math.min(limit, 12) },
    ]);
    const ok = sigs.filter((s) => !s.err).slice(0, limit);

    const parsed: (Transfer | null)[] = [];
    for (const s of ok) {
      parsed.push(
        await (async () => {
        try {
          const tx = await solanaRpc<{
            meta?: {
              preTokenBalances?: {
                mint: string;
                owner?: string;
                uiTokenAmount: { uiAmount: number | null };
              }[];
              postTokenBalances?: {
                mint: string;
                owner?: string;
                uiTokenAmount: { uiAmount: number | null };
              }[];
            };
            blockTime?: number;
          }>("getTransaction", [
            s.signature,
            { maxSupportedTransactionVersion: 0, encoding: "jsonParsed" },
          ]);

          const pre = (tx.meta?.preTokenBalances ?? []).filter((b) => b.mint === XNOVA.tokenMint);
          const post = (tx.meta?.postTokenBalances ?? []).filter((b) => b.mint === XNOVA.tokenMint);
          if (post.length === 0) return null;

          const deltas = post.map((b) => {
            const before =
              pre.find((x) => x.owner === b.owner)?.uiTokenAmount.uiAmount ?? 0;
            return { owner: b.owner ?? "", delta: (b.uiTokenAmount.uiAmount ?? 0) - before };
          });
          const receiver = deltas.filter((d) => d.delta > 0).sort((a, b) => b.delta - a.delta)[0];
          const sender = deltas.filter((d) => d.delta < 0).sort((a, b) => a.delta - b.delta)[0];
          if (!receiver && !sender) return null;

          return {
            signature: s.signature,
            from: sender?.owner ?? "",
            to: receiver?.owner ?? "",
            amount: Math.abs(receiver?.delta ?? sender?.delta ?? 0),
            timestamp: (tx.blockTime ?? s.blockTime ?? 0) * 1000,
          } satisfies Transfer;
        } catch {
          return null;
        }
        })(),
      );
    }

    const transfers = parsed.filter((t): t is Transfer => t !== null);
    if (transfers.length === 0) throw new Error("No parsed transfers in the recent window");
    return transfers;
  });
}
