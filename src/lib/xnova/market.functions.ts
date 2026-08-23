import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { attempt } from "./result";
import { fetchMarketSnapshot } from "./providers/dexscreener.server";
import { fetchCandles, fetchTrades } from "./providers/geckoterminal.server";
import {
  fetchTokenMeta,
  fetchTopHolders,
  fetchTransfers,
} from "./providers/solscan.server";

export const getMarket = createServerFn({ method: "GET" }).handler(async () =>
  attempt("dexscreener", fetchMarketSnapshot),
);

export const getCandles = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z
      .object({
        timeframe: z.enum(["minute", "hour", "day"]),
        aggregate: z.number().int().min(1).max(30),
      })
      .parse(input),
  )
  .handler(async ({ data }) =>
    attempt("geckoterminal", () => fetchCandles(data.timeframe, data.aggregate)),
  );

export const getTrades = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ minUsd: z.number().min(0).max(1_000_000).default(0) }).parse(input ?? {}),
  )
  .handler(async ({ data }) => attempt("geckoterminal", () => fetchTrades(data.minUsd)));

export const getTokenMeta = createServerFn({ method: "GET" }).handler(async () =>
  attempt("solscan", fetchTokenMeta),
);

export const getHolders = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ limit: z.number().int().min(1).max(50).default(20) }).parse(input ?? {}),
  )
  .handler(async ({ data }) => attempt("solscan", () => fetchTopHolders(data.limit)));

export const getTransfers = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ limit: z.number().int().min(1).max(50).default(20) }).parse(input ?? {}),
  )
  .handler(async ({ data }) => attempt("solscan", () => fetchTransfers(data.limit)));
