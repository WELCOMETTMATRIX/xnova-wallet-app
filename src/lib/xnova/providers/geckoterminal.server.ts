import { XNOVA } from "../config";
import type { Candle, Trade } from "../types";
import { cachedJson, getJson } from "./http.server";

const BASE = "https://api.geckoterminal.com/api/v2";

interface OhlcvResponse {
  data?: { attributes?: { ohlcv_list?: number[][] } };
}

/** OHLCV candles for the primary pool (GeckoTerminal public API). */
export async function fetchCandles(
  timeframe: "minute" | "hour" | "day",
  aggregate: number,
  limit = 300,
): Promise<Candle[]> {
  return cachedJson(`gt:ohlcv:${timeframe}:${aggregate}`, 20_000, async () => {
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
  return cachedJson(`gt:trades:${minUsd}`, 15_000, async () => {
    const url = `${BASE}/networks/solana/pools/${XNOVA.primaryPair}/trades?trade_volume_in_usd_greater_than=${minUsd}`;
    const payload = await getJson<{ data?: GtTrade[] }>(url);
    return (payload.data ?? [])
      .map((t) => {
        const a = t.attributes ?? {};
        const kind = a.kind === "sell" ? "sell" : "buy";
        const valueUsd = Number(a.volume_in_usd ?? 0);
        const priceUsd = Number(
          (kind === "buy" ? a.price_to_in_usd : a.price_from_in_usd) ?? 0,
        );
        const amountToken = Number(
          (kind === "buy" ? a.to_token_amount : a.from_token_amount) ?? 0,
        );
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
