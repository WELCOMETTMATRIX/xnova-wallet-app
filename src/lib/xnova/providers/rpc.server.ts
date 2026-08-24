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
  tokensValueUsd: number | null;
  totalValueUsd: number | null;
  pricedCount: number;
  tokens: PortfolioToken[];
  // Tokens exist but were not priced because pricing is slow / unavailable.
  unpricedCount: number;
  // True if prices were cut short to meet the response budget.
  partial: boolean;
  // Human-readable timing note.
  source: string;
}

const SOL_MINT = "So11111111111111111111111111111111111111112";
const LEGACY_TOKEN_PROGRAM = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
const TOKEN_2022_PROGRAM = "TokenzQdBNbBqPp7Z3ha7pJ9Zf3G5m1V8Zz";

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
  timeoutMs: number,
): Promise<Map<string, { priceUsd: number; symbol: string | null; name: string | null; icon: string | null }>> {
  const out = new Map<
    string,
    { priceUsd: number; symbol: string | null; name: string | null; icon: string | null }
  >();
  const unique = [...new Set(mints)].slice(0, 40);
  const chunks: string[][] = [];
  for (let i = 0; i < unique.length; i += 20) chunks.push(unique.slice(i, i + 20));

  const deadline = Date.now() + timeoutMs;

  await Promise.all(
    chunks.map(async (chunk) => {
      if (Date.now() > deadline) return;
      const key = `ds:prices:${chunk.join(",")}`;
      try {
        const payload = await cachedJson(key, 60_000, () =>
          getJson<{ pairs?: DsToken[] | null }>(
            `https://api.dexscreener.com/latest/dex/tokens/${chunk.join(",")}`,
            { timeoutMs: 7_000, retries: 1 },
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

const BASE58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export function isSolanaAddress(address: string): boolean {
  return BASE58.test(address);
}

interface TokenAccount {
  mint: string;
  amount: number;
  decimals: number;
  programId: string;
}

function parseTokenAccounts(
  programId: string,
  value: { account: { data: { parsed: { info: { mint: string; tokenAmount: { amount: string; decimals: number; uiAmount: number | null } } } } } }[];
} {
  return (value ?? []).map((a) => a.account.data.parsed.info).map((i) => ({
    mint: i.mint,
    amount: i.tokenAmount.uiAmount ?? 0,
    decimals: i.tokenAmount.decimals,
    programId,
  }));
}

export async function fetchWalletPortfolio(address: string): Promise<WalletPortfolio> {
  if (!isSolanaAddress(address)) throw new Error("Invalid Solana wallet address");

  const BUDGET_MS = 12_000;
  const deadline = Date.now() + BUDGET_MS;
  const balancePromise = rpc<{ value: number }>("getBalance", [address]);

  const accountsPromise = Promise.all([
    rpc<{
      value: { account: { data: { parsed: { info: { mint: string; tokenAmount: { amount: string; decimals: number; uiAmount: number | null } } } } } }[];
    }>("getTokenAccountsByOwner", [
      address,
      { programId: LEGACY_TOKEN_PROGRAM },
      { encoding: "jsonParsed" },
    ]),
    rpc<{
      value: { account: { data: { parsed: { info: { mint: string; tokenAmount: { amount: string; decimals: number; uiAmount: number | null } } } } } }[];
    }>("getTokenAccountsByOwner", [
      address,
      { programId: TOKEN_2022_PROGRAM },
      { encoding: "jsonParsed" },
    ]),
  ]);

  const [lamports, [legacy, token2022]] = await Promise.all([balancePromise, accountsPromise]);

  const raw: TokenAccount[] = parseTokenAccounts(LEGACY_TOKEN_PROGRAM, legacy.value)
    .concat(parseTokenAccounts(TOKEN_2022_PROGRAM, token2022.value))
    .filter((t) => t.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  const xnova = raw.find((t) => t.mint === XNOVA.tokenMint);
  const topByAmount = raw.slice(0, 20);
  const priority = [XNOVA.tokenMint, SOL_MINT, ...topByAmount.map((t) => t.mint)];
  const priceBudget = Math.max(2_000, deadline - Date.now() - 1_500);
  const prices = await fetchTokenPrices(priority, priceBudget);
  const partial = Date.now() > deadline - 500;

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
  const tokensValueUsd = priced.length > 0 ? priced.reduce((s, t) => s + (t.valueUsd ?? 0), 0) : null;

  return {
    address,
    solBalance,
    solPriceUsd,
    solValueUsd,
    xnovaBalance: xnova?.amount ?? 0,
    tokensValueUsd,
    totalValueUsd:
      solValueUsd != null || tokensValueUsd != null ? (solValueUsd ?? 0) + (tokensValueUsd ?? 0) : null,
    pricedCount: priced.length,
    unpricedCount: tokens.length - priced.length,
    tokens,
    partial,
    source: partial ? "Solana RPC + partial pricing" : "Solana RPC + DexScreener",
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
