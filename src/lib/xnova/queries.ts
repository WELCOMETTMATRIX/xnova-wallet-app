import { queryOptions } from "@tanstack/react-query";

import {
  getCandles,
  getHolders,
  getMarket,
  getTokenMeta,
  getTrades,
  getTransfers,
} from "./market.functions";
import { getPublicConfig } from "./public-config.functions";
import { getAlertStatus } from "./alerts.functions";
import type { TimeframeLabel } from "./config";
import { TIMEFRAMES } from "./config";

export const marketQuery = () =>
  queryOptions({
    queryKey: ["xnova", "market"],
    queryFn: () => getMarket(),
    refetchInterval: 20_000,
    staleTime: 15_000,
    retry: 3,
    refetchOnWindowFocus: true,
  });

export const candlesQuery = (label: TimeframeLabel) => {
  const tf = TIMEFRAMES.find((t) => t.label === label) ?? TIMEFRAMES[3];
  return queryOptions({
    queryKey: ["xnova", "candles", label],
    queryFn: () => getCandles({ data: { timeframe: tf.timeframe, aggregate: tf.aggregate } }),
    refetchInterval: 30_000,
    staleTime: 25_000,
    retry: 2,
    refetchOnWindowFocus: true,
  });
};

export const tradesQuery = (minUsd = 0) =>
  queryOptions({
    queryKey: ["xnova", "trades", minUsd],
    queryFn: () => getTrades({ data: { minUsd } }),
    refetchInterval: 20_000,
    retry: 3,
    refetchOnWindowFocus: true,
  });

export const holdersQuery = (limit = 20) =>
  queryOptions({
    queryKey: ["xnova", "holders", limit],
    queryFn: () => getHolders({ data: { limit } }),
    refetchInterval: 90_000,
    retry: 2,
    refetchOnWindowFocus: true,
  });

export const tokenMetaQuery = () =>
  queryOptions({
    queryKey: ["xnova", "meta"],
    queryFn: () => getTokenMeta(),
    refetchInterval: 180_000,
    retry: 2,
  });

export const transfersQuery = (limit = 20) =>
  queryOptions({
    queryKey: ["xnova", "transfers", limit],
    queryFn: () => getTransfers({ data: { limit } }),
    refetchInterval: 45_000,
    retry: 2,
    refetchOnWindowFocus: true,
  });

export const publicConfigQuery = () =>
  queryOptions({
    queryKey: ["xnova", "config"],
    queryFn: () => getPublicConfig(),
    staleTime: Infinity,
  });

export const alertStatusQuery = () =>
  queryOptions({
    queryKey: ["xnova", "alert-status"],
    queryFn: () => getAlertStatus(),
    refetchInterval: 20_000,
    retry: 2,
    refetchOnWindowFocus: true,
  });
