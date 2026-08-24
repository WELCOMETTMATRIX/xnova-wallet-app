import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { attempt, withTimeout } from "./result";
import { fetchMarket } from "./providers/market.server";
import { fetchChainTrades } from "./providers/chain-trades.server";
import {
  fetchHoldersResilient,
  fetchTokenMetaResilient,
  fetchTransfersResilient,
} from "./providers/onchain-resolve.server";

export const getMarket = createServerFn({ method: "GET" }).handler(async () => {
  const result = await attempt("dexscreener", fetchMarket);
  // Automatic alert loop: every live market poll keeps the Telegram engine warm.
  try {
    const { maybeRunAlertScan } = await import("./alerts.server");
    await maybeRunAlertScan();
  } catch (error) {
    console.error("[xnova:autoscan]", error instanceof Error ? error.message : error);
  }
  return result;
});

export const getCandles = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z
      .object({
        timeframe: z.enum(["minute", "hour", "day"]),
        aggregate: z.number().int().min(1).max(30),
      })
      .parse(input),
  )
  .handler(async () => attempt("dexscreener-chart", async () => []));

export const getTrades = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ minUsd: z.number().min(0).max(1_000_000).default(0) }).parse(input ?? {}),
  )
  .handler(async ({ data }) =>
    attempt("dexscreener-onchain-trades", async () =>
      (await fetchChainTrades(50)).filter((trade) => trade.valueUsd >= data.minUsd),
    ),
  );

export const getTokenMeta = createServerFn({ method: "GET" }).handler(async () =>
  attempt("token-meta", () => withTimeout(12_000, fetchTokenMetaResilient)),
);

export const getHolders = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ limit: z.number().int().min(1).max(50).default(20) }).parse(input ?? {}),
  )
  .handler(async ({ data }) =>
    attempt("holders", () => withTimeout(15_000, () => fetchHoldersResilient(data.limit))),
  );

export const getTransfers = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ limit: z.number().int().min(1).max(50).default(20) }).parse(input ?? {}),
  )
  .handler(async ({ data }) =>
    attempt("transfers", () => withTimeout(15_000, () => fetchTransfersResilient(data.limit))),
  );
