import { XNOVA } from "../config";
import type { Candle, MarketSnapshot, Trade } from "../types";
import { cachedJson, getJson } from "./http.server";

const BASE = "https://api.geckoterminal.com/api/v2";

const num = (v: unknown): number | null => {
  const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? n : null;
};

interface GtPool {
  attributes?: {
    address?: string;
    name?: string;
    base_token_price_usd?: string;
    base_token_price_native_currency?: string;
    fdv_usd?: string;
    market_cap_usd?: string | null;
    reserve_in_usd?: string;
    pool_created_at?: string;
    price_change_percentage?: Record<string, string>;
    volume_usd?: Record<string, string>;
    transactions?: Record<string, { buys?: number; sells?: number }>;
  };
  relationships?: { dex?: { data?: { id?: string } } };
}

/** Market snapshot from the GeckoTerminal pool endpoint (fallback provider). */
export async function fetchPoolMarket(): Promise<MarketSnapshot> {
  return cachedJson("gt:pool", 30_000, async () => {
    const payload = await getJson<{ data?: GtPool }>(
      `${BASE}/networks/solana/pools/${XNOVA.primaryPair}`,
    );
    const a = payload.data?.attributes;
    if (!a) throw new Error("No GeckoTerminal pool data");
    const [baseSymbol, quoteSymbol] = (a.name ?? "").split(" / ");

    return {
      priceUsd: num(a.base_token_price_usd),
      priceNative: num(a.base_token_price_native_currency),
      change: {
        m5: num(a.price_change_percentage?.["m5"]),
        h1: num(a.price_change_percentage?.["h1"]),
        h6: num(a.price_change_percentage?.["h6"]),
        h24: num(a.price_change_percentage?.["h24"]),
      },
      volume24h: num(a.volume_usd?.["h24"]),
      liquidityUsd: num(a.reserve_in_usd),
      fdv: num(a.fdv_usd),
      marketCap: num(a.market_cap_usd) ?? num(a.fdv_usd),
      txns24h: {
        buys: num(a.transactions?.["h24"]?.buys),
        sells: num(a.transactions?.["h24"]?.sells),
      },
      pairAddress: a.address ?? XNOVA.primaryPair,
      dexId: payload.data?.relationships?.dex?.data?.id ?? null,
      baseSymbol: baseSymbol ?? null,
      baseName: baseSymbol ?? null,
      quoteSymbol: quoteSymbol ?? null,
      pairCreatedAt: a.pool_created_at ? Date.parse(a.pool_created_at) : null,
    } satisfies MarketSnapshot;
  });
}

interface OhlcvResponse {
  data?: { attributes?: { ohlcv_list?: number[][] } };
}

/** OHLCV candles for the primary pool (GeckoTerminal public API). */
export async function fetchCandles(
  timeframe: "minute" | "hour" | "day",
  aggregate: number,
  limit = 300,
): Promise<Candle[]> {
  return cachedJson(`gt:ohlcv:${timeframe}:${aggregate}`, 90_000, async () => {
    const url = `${BASE}/networks/solana/pools/${XNOVA.primaryPair}/ohlcv/${timeframe}?aggregate=${aggregate}&limit=${limit}&currency=usd`;
    const payload = await getJson<OhlcvResponse>(url);
    const list = payload.data?.attributes?.ohlcv_list ?? [];
    return list
      .map((row) => ({
        time: Number(row[0]),
        open: Number(row[1]),
        high: Number(row[2]),
        low: Number(row[3]),
        close: Number(row[4]),
        volume: Number(row[5] ?? 0),
      }))
      .filter((c) => Number.isFinite(c.time) && Number.isFinite(c.close))
      .sort((a, b) => a.time - b.time);
  });
}

interface GtTrade {
  id: string;
  attributes?: {
    tx_hash?: string;
    tx_from_address?: string;
    kind?: string;
    price_to_in_usd?: string;
    price_from_in_usd?: string;
    from_token_amount?: string;
    to_token_amount?: string;
    volume_in_usd?: string;
    block_timestamp?: string;
  };
}

/** Recent pool trades. Used for the trade tape and the whale tracker. */
export async function fetchTrades(minUsd = 0): Promise<Trade[]> {
  return cachedJson(`gt:trades:${minUsd}`, 60_000, async () => {
    const url = `${BASE}/networks/solana/pools/${XNOVA.primaryPair}/trades?trade_volume_in_usd_greater_than=${minUsd}`;
    const payload = await getJson<{ data?: GtTrade[] }>(url);
    return (payload.data ?? [])
      .map((t) => {
        const a = t.attributes ?? {};
        const kind = a.kind === "sell" ? "sell" : "buy";
        const valueUsd = Number(a.volume_in_usd ?? 0);
        const priceUsd = Number((kind === "buy" ? a.price_to_in_usd : a.price_from_in_usd) ?? 0);
        const amountToken = Number((kind === "buy" ? a.to_token_amount : a.from_token_amount) ?? 0);
        return {
          id: t.id,
          kind,
          priceUsd,
          amountToken,
          valueUsd,
          wallet: a.tx_from_address ?? "",
          txHash: a.tx_hash ?? null,
          timestamp: a.block_timestamp ? Date.parse(a.block_timestamp) : Date.now(),
        } satisfies Trade;
      })
      .filter((t) => Number.isFinite(t.valueUsd))
      .sort((a, b) => b.timestamp - a.timestamp);
  });
}
