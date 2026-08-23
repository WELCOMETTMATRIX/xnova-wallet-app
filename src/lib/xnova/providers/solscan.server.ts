import { XNOVA } from "../config";
import type { Holder, TokenMeta, Transfer } from "../types";
import { cachedJson, getJson } from "./http.server";

const PRO = "https://pro-api.solscan.io/v2.0";

function apiKey(): string {
  const key = process.env["SOLSCAN_API_KEY"];
  if (!key) throw new Error("Solscan API key is not configured");
  return key;
}

function headers() {
  return { token: apiKey() };
}

interface MetaResponse {
  data?: {
    address?: string;
    name?: string;
    symbol?: string;
    decimals?: number;
    supply?: string | number;
    holder?: number;
    icon?: string;
  };
}

export async function fetchTokenMeta(): Promise<TokenMeta> {
  return cachedJson("solscan:meta", 60_000, async () => {
    const payload = await getJson<MetaResponse>(
      `${PRO}/token/meta?address=${XNOVA.tokenMint}`,
      { headers: headers() },
    );
    const d = payload.data ?? {};
    const decimals = typeof d.decimals === "number" ? d.decimals : null;
    const rawSupply = d.supply == null ? null : Number(d.supply);
    return {
      address: d.address ?? XNOVA.tokenMint,
      name: d.name ?? null,
      symbol: d.symbol ?? null,
      decimals,
      supply:
        rawSupply != null && Number.isFinite(rawSupply)
          ? decimals != null
            ? rawSupply / 10 ** decimals
            : rawSupply
          : null,
      holders: typeof d.holder === "number" ? d.holder : null,
      icon: d.icon ?? null,
    } satisfies TokenMeta;
  });
}

interface HoldersResponse {
  data?: {
    total?: number;
    items?: { address?: string; owner?: string; amount?: number; decimals?: number; rank?: number }[];
  };
}

export async function fetchTopHolders(limit = 20): Promise<{ holders: Holder[]; total: number | null }> {
  return cachedJson(`solscan:holders:${limit}`, 60_000, async () => {
    const payload = await getJson<HoldersResponse>(
      `${PRO}/token/holders?address=${XNOVA.tokenMint}&page=1&page_size=${limit}`,
      { headers: headers() },
    );
    const items = payload.data?.items ?? [];
    let supply: number | null = null;
    try {
      supply = (await fetchTokenMeta()).supply;
    } catch {
      supply = null;
    }
    const holders = items.map((h, i) => {
      const decimals = h.decimals ?? 6;
      const amount = (h.amount ?? 0) / 10 ** decimals;
      return {
        address: h.owner ?? h.address ?? "",
        amount,
        decimals,
        rank: h.rank ?? i + 1,
        share: supply && supply > 0 ? (amount / supply) * 100 : null,
      } satisfies Holder;
    });
    return { holders, total: payload.data?.total ?? null };
  });
}

interface TransfersResponse {
  data?: {
    trans_id?: string;
    from_address?: string;
    to_address?: string;
    amount?: number;
    token_decimals?: number;
    block_time?: number;
  }[];
}

export async function fetchTransfers(limit = 20): Promise<Transfer[]> {
  return cachedJson(`solscan:transfers:${limit}`, 30_000, async () => {
    const payload = await getJson<TransfersResponse>(
      `${PRO}/token/transfer?address=${XNOVA.tokenMint}&page=1&page_size=${limit}&sort_by=block_time&sort_order=desc`,
      { headers: headers() },
    );
    return (payload.data ?? []).map((t) => ({
      signature: t.trans_id ?? "",
      from: t.from_address ?? "",
      to: t.to_address ?? "",
      amount: (t.amount ?? 0) / 10 ** (t.token_decimals ?? 6),
      timestamp: (t.block_time ?? 0) * 1000,
    }));
  });
}

export function solscanConfigured(): boolean {
  return Boolean(process.env["SOLSCAN_API_KEY"]);
}
