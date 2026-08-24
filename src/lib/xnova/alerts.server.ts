import { fetchMarket as fetchMarketSnapshot } from "./providers/market.server";
import { fetchChainTrades } from "./providers/chain-trades.server";
import {
  formatPriceAlert,
  formatTradeAlert,
  sendTelegram,
  telegramConfigured,
} from "./telegram.server";
import { formatPct, formatUsd } from "./config";

export interface AlertThresholds {
  /** Minimum trade value (USD) that triggers a buy/sell notification. */
  minTradeUsd: number;
  /** Trade value (USD) considered whale activity. */
  whaleUsd: number;
  /** Absolute 1h price move (%) that triggers a price alert. */
  pricePct: number;
}

// Every trade from $1 upwards is reported, with no upper bound.
export const DEFAULT_THRESHOLDS: AlertThresholds = {
  minTradeUsd: 1,
  whaleUsd: 5_000,
  pricePct: 10,
};

/** In-memory scan state. Deduplicates alerts between scan invocations. */
const state = {
  lastTradeTs: 0,
  seen: new Set<string>(),
  lastPriceAlertAt: 0,
  sent: 0,
  lastRunAt: 0,
  lastError: null as string | null,
};

export function alertState() {
  return {
    lastRunAt: state.lastRunAt,
    sent: state.sent,
    lastError: state.lastError,
    telegramConfigured: telegramConfigured(),
  };
}

function thresholds(): AlertThresholds {
  const env = (k: string, fallback: number) => {
    const raw = process.env[k];
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) && n > 0 ? n : fallback;
  };
  return {
    // Always track every transaction from $1 upward. This is intentionally not
    // user-configurable and has no maximum cap, so small buys / sells are never
    // hidden by an environment override or UI control.
    minTradeUsd: DEFAULT_THRESHOLDS.minTradeUsd,
    whaleUsd: env("XNOVA_ALERT_WHALE_USD", DEFAULT_THRESHOLDS.whaleUsd),
    pricePct: env("XNOVA_ALERT_PRICE_PCT", DEFAULT_THRESHOLDS.pricePct),
  };
}

/**
 * Scans recent on-chain trade activity and pushes a Telegram notification for
 * every qualifying buy / sell, plus price-move alerts. Idempotent per trade.
 */
export async function runAlertScan(): Promise<{
  scanned: number;
  notified: number;
  skipped?: string;
}> {
  state.lastRunAt = Date.now();
  state.lastError = null;

  if (!telegramConfigured()) {
    return { scanned: 0, notified: 0, skipped: "telegram_not_configured" };
  }

  const cfg = thresholds();
  let notified = 0;
  let scanned = 0;

  try {
    let trades = await fetchChainTrades(30).catch(
      () => [] as Awaited<ReturnType<typeof fetchChainTrades>>,
    );
    trades = trades.filter((t) => t.valueUsd >= cfg.minTradeUsd);
    scanned = trades.length;
    const fresh = trades
      .filter((t) => !state.seen.has(t.id) && t.timestamp > state.lastTradeTs)
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-25);

    // First run only primes the cursor so history is not replayed into chat.
    // On-chain reconstruction returns newest first, so the cursor must be the newest
    // timestamp; otherwise older trades could block new $1+ transactions.
    if (state.lastTradeTs === 0) {
      for (const t of trades) state.seen.add(t.id);
      state.lastTradeTs = Math.max(0, ...trades.map((t) => t.timestamp));
    } else {
      for (const trade of fresh) {
        await sendTelegram(formatTradeAlert(trade, trade.valueUsd >= cfg.whaleUsd));
        state.seen.add(trade.id);
        state.lastTradeTs = Math.max(state.lastTradeTs, trade.timestamp);
        notified += 1;
        state.sent += 1;
      }
    }
    if (state.seen.size > 2000) state.seen = new Set([...state.seen].slice(-1000));

    const market = await fetchMarketSnapshot();
    const h1 = market.change.h1;
    if (
      h1 != null &&
      Math.abs(h1) >= cfg.pricePct &&
      Date.now() - state.lastPriceAlertAt > 30 * 60 * 1000
    ) {
      await sendTelegram(
        formatPriceAlert(
          "PRICE ALERT",
          `1h move: <b>${formatPct(h1)}</b>\nPrice: <b>${formatUsd(market.priceUsd, 8)}</b>\nLiquidity: ${formatUsd(market.liquidityUsd)}\n24h Volume: ${formatUsd(market.volume24h)}`,
        ),
      );
      state.lastPriceAlertAt = Date.now();
      notified += 1;
      state.sent += 1;
    }
  } catch (error) {
    state.lastError = error instanceof Error ? error.message : "Unknown error";
    throw error;
  }

  return { scanned, notified };
}

/**
 * Automatic scheduler. The scan is fully agent-driven: any live data request
 * from the terminal or the public market endpoint keeps the alert loop warm,
 * throttled so the upstream providers are never hammered. Users cannot enable,
 * disable or configure alerts — the engine decides on its own.
 */
const AUTO_INTERVAL_MS = 45_000;
let inFlight: Promise<unknown> | null = null;

export async function maybeRunAlertScan(): Promise<void> {
  if (!telegramConfigured()) return;
  if (inFlight) return;
  if (Date.now() - state.lastRunAt < AUTO_INTERVAL_MS) return;
  inFlight = runAlertScan().catch((error: unknown) => {
    console.error("[xnova:autoscan]", error instanceof Error ? error.message : error);
  });
  try {
    await inFlight;
  } finally {
    inFlight = null;
  }
}
