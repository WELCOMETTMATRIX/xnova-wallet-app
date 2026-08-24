import { XNOVA } from "../config";
import { cachedJson, getJson } from "./http.server";
import { solanaRpc as rpc } from "./onchain.server";

export interface PortfolioToken {
  mint: string;
  amount: number;
  decimals: number;
  symbol: string | null;
  name: string | null;
  priceUsd: number | null;
  valueUsd: number | null;
  icon: string | null;
}

export interface WalletPortfolio {
  address: string;
  solBalance: number;
  solPriceUsd: number | null;
  solValueUsd: number | null;
  xnovaBalance: number | null;
  xnovaValueUsd: number | null;
  tokensValueUsd: number | null;
  totalValueUsd: number | null;
  pricedCount: number;
  tokens: PortfolioToken[];
}

const SOL_MINT = "So11111111111111111111111111111111111111112";
const LEGACY_TOKEN_PROGRAM = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
// XNOVA and most pump.fun era mints are Token-2022 accounts; the legacy program
// query alone returns none of them, which is why XNOVA read as 0.
const TOKEN_2022_PROGRAM = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";

interface DsToken {
  chainId?: string;
  baseToken?: { address?: string; symbol?: string; name?: string };
  priceUsd?: string;
  liquidity?: { usd?: number };
  info?: { imageUrl?: string };
}

/** Live USD prices for a batch of SPL mints (DexScreener, public API). */
async function fetchTokenPrices(
  mints: string[],
): Promise<
  Map<string, { priceUsd: number; symbol: string | null; name: string | null; icon: string | null }>
> {
  const out = new Map<
    string,
    { priceUsd: number; symbol: string | null; name: string | null; icon: string | null }
  >();
  const unique = [...new Set(mints)].slice(0, 60);
  const chunks: string[][] = [];
  for (let i = 0; i < unique.length; i += 30) chunks.push(unique.slice(i, i + 30));

  await Promise.all(
    chunks.map(async (chunk) => {
      const key = `ds:prices:${chunk.join(",")}`;
      try {
        const payload = await cachedJson(key, 60_000, () =>
          getJson<{ pairs?: DsToken[] | null }>(
            `https://api.dexscreener.com/latest/dex/tokens/${chunk.join(",")}`,
          ),
        );
        for (const pair of payload.pairs ?? []) {
          const address = pair.baseToken?.address;
          const price = Number(pair.priceUsd ?? NaN);
          if (!address || !Number.isFinite(price)) continue;
          const existing = out.get(address);
          if (existing && existing.priceUsd > 0 && (pair.liquidity?.usd ?? 0) === 0) continue;
          out.set(address, {
            priceUsd: price,
            symbol: pair.baseToken?.symbol ?? null,
            name: pair.baseToken?.name ?? null,
            icon: pair.info?.imageUrl ?? null,
          });
        }
      } catch {
        /* pricing is best-effort; balances still render */
      }
    }),
  );
  return out;
}

/** Last-resort XNOVA price when DexScreener has no indexed pair yet. */
async function fetchXnovaPriceFallback(): Promise<number | null> {
  try {
    const payload = await cachedJson(`jup:price:${XNOVA.tokenMint}`, 60_000, () =>
      getJson<{ data?: Record<string, { price?: number | string }> }>(
        `https://lite-api.jup.ag/price/v2?ids=${XNOVA.tokenMint}`,
        { timeoutMs: 7_000, retries: 1 },
      ),
    );
    const price = Number(payload.data?.[XNOVA.tokenMint]?.price ?? NaN);
    return Number.isFinite(price) && price > 0 ? price : null;
  } catch {
    return null;
  }
}

const BASE58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export function isSolanaAddress(address: string): boolean {
  return BASE58.test(address);
}

interface ParsedAccountsResult {
  value: {
    account: {
      data: {
        parsed: {
          info: {
            mint: string;
            tokenAmount: { amount: string; decimals: number; uiAmount: number | null };
          };
        };
      };
    };
  }[];
}

function parseAccounts(result: ParsedAccountsResult | null) {
  return (result?.value ?? []).map((a) => {
    const info = a.account.data.parsed.info;
    return {
      mint: info.mint,
      amount: info.tokenAmount.uiAmount ?? 0,
      decimals: info.tokenAmount.decimals,
    };
  });
}

export async function fetchWalletPortfolio(address: string): Promise<WalletPortfolio> {
  if (!isSolanaAddress(address)) throw new Error("Invalid Solana wallet address");

  const [lamports, legacy, token2022] = await Promise.all([
    rpc<{ value: number }>("getBalance", [address]),
    rpc<ParsedAccountsResult>("getTokenAccountsByOwner", [
      address,
      { programId: LEGACY_TOKEN_PROGRAM },
      { encoding: "jsonParsed" },
    ]).catch(() => null),
    // Token-2022 holdings (XNOVA lives here).
    rpc<ParsedAccountsResult>("getTokenAccountsByOwner", [
      address,
      { programId: TOKEN_2022_PROGRAM },
      { encoding: "jsonParsed" },
    ]).catch(() => null),
  ]);

  const raw = [...parseAccounts(legacy), ...parseAccounts(token2022)]
    .filter((t) => t.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  // Authoritative XNOVA lookup: a single program-wide query can be rejected by a
  // public RPC, so the token the terminal cares about is read by mint directly.
  if (!raw.some((t) => t.mint === XNOVA.tokenMint)) {
    const direct = await rpc<ParsedAccountsResult>("getTokenAccountsByOwner", [
      address,
      { mint: XNOVA.tokenMint },
      { encoding: "jsonParsed" },
    ]).catch(() => null);
    const xnova = parseAccounts(direct).reduce(
      (sum, t) => ({ ...t, amount: sum.amount + t.amount }),
      { mint: XNOVA.tokenMint, amount: 0, decimals: 6 },
    );
    if (xnova.amount > 0) raw.unshift(xnova);
  }

  const prices = await fetchTokenPrices([SOL_MINT, XNOVA.tokenMint, ...raw.map((t) => t.mint)]);

  // DexScreener sometimes has no indexed pair for a fresh pump.fun mint.
  if (!prices.has(XNOVA.tokenMint) && raw.some((t) => t.mint === XNOVA.tokenMint)) {
    const fallback = await fetchXnovaPriceFallback();
    if (fallback != null) {
      prices.set(XNOVA.tokenMint, {
        priceUsd: fallback,
        symbol: "XNOVA",
        name: "XNOVA",
        icon: null,
      });
    }
  }

  const tokens: PortfolioToken[] = raw.map((t) => {
    const meta = prices.get(t.mint);
    const priceUsd = meta?.priceUsd ?? null;
    return {
      ...t,
      symbol: meta?.symbol ?? (t.mint === XNOVA.tokenMint ? "XNOVA" : null),
      name: meta?.name ?? null,
      priceUsd,
      valueUsd: priceUsd != null ? t.amount * priceUsd : null,
      icon: meta?.icon ?? null,
    };
  });
  tokens.sort((a, b) => (b.valueUsd ?? -1) - (a.valueUsd ?? -1));

  const solBalance = (lamports.value ?? 0) / 1e9;
  const solPriceUsd = prices.get(SOL_MINT)?.priceUsd ?? null;
  const solValueUsd = solPriceUsd != null ? solBalance * solPriceUsd : null;
  const priced = tokens.filter((t) => t.valueUsd != null);
  const tokensValueUsd =
    priced.length > 0 ? priced.reduce((s, t) => s + (t.valueUsd ?? 0), 0) : null;
  const xnovaToken = tokens.find((t) => t.mint === XNOVA.tokenMint);

  return {
    address,
    solBalance,
    solPriceUsd,
    solValueUsd,
    xnovaBalance: xnovaToken?.amount ?? 0,
    xnovaValueUsd: xnovaToken?.valueUsd ?? null,
    tokensValueUsd,
    totalValueUsd:
      solValueUsd != null || tokensValueUsd != null
        ? (solValueUsd ?? 0) + (tokensValueUsd ?? 0)
        : null,
    pricedCount: priced.length,
    tokens,
  };
}

export interface SolPrice {
  usd: number;
}

export async function fetchSolPrice(): Promise<SolPrice> {
  const payload = await getJson<{ pairs?: { priceUsd?: string }[] }>(
    "https://api.dexscreener.com/latest/dex/tokens/So11111111111111111111111111111111111111112",
  );
  const price = Number(payload.pairs?.[0]?.priceUsd ?? NaN);
  if (!Number.isFinite(price)) throw new Error("No SOL price available");
  return { usd: price };
}
