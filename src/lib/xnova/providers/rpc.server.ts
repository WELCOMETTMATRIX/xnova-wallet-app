import { XNOVA } from "../config";
import { getJson } from "./http.server";

function rpcUrl(): string {
  return process.env["SOLANA_RPC_URL"] || "https://api.mainnet-beta.solana.com";
}

async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  const res = await fetch(rpcUrl(), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  if (!res.ok) throw new Error(`Solana RPC ${res.status}`);
  const payload = (await res.json()) as { result?: T; error?: { message?: string } };
  if (payload.error) throw new Error(payload.error.message ?? "Solana RPC error");
  if (payload.result === undefined) throw new Error("Empty Solana RPC result");
  return payload.result;
}

export interface WalletPortfolio {
  address: string;
  solBalance: number;
  xnovaBalance: number | null;
  tokens: { mint: string; amount: number; decimals: number }[];
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

  const tokens = (accounts.value ?? [])
    .map((a) => a.account.data.parsed.info)
    .map((i) => ({
      mint: i.mint,
      amount: i.tokenAmount.uiAmount ?? 0,
      decimals: i.tokenAmount.decimals,
    }))
    .filter((t) => t.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  return {
    address,
    solBalance: (lamports.value ?? 0) / 1e9,
    xnovaBalance: tokens.find((t) => t.mint === XNOVA.tokenMint)?.amount ?? 0,
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
