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
}

const SOL_MINT = "So11111111111111111111111111111111111111112";

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
): Promise<Map<string, { priceUsd: number; symbol: string | null; name: string | null; icon: string | null }>> {
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

const BASE58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export function isSolanaAddress(address: string): boolean {
  return BASE58.test(address);
}

export async function fetchWalletPortfolio(address: string): Promise<WalletPortfolio> {
  if (!isSolanaAddress(address)) throw new Error("Invalid Solana wallet address");

  const lamports = await rpc<{ value: number }>("getBalance", [address]);
  const accounts = await rpc<{
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
  }>("getTokenAccountsByOwner", [
    address,
    { programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
    { encoding: "jsonParsed" },
  ]);

  const raw = (accounts.value ?? [])
    .map((a) => a.account.data.parsed.info)
    .map((i) => ({
      mint: i.mint,
      amount: i.tokenAmount.uiAmount ?? 0,
      decimals: i.tokenAmount.decimals,
    }))
    .filter((t) => t.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  const prices = await fetchTokenPrices([SOL_MINT, ...raw.map((t) => t.mint)]);

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
    xnovaBalance: tokens.find((t) => t.mint === XNOVA.tokenMint)?.amount ?? 0,
    tokensValueUsd,
    totalValueUsd:
      solValueUsd != null || tokensValueUsd != null ? (solValueUsd ?? 0) + (tokensValueUsd ?? 0) : null,
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
