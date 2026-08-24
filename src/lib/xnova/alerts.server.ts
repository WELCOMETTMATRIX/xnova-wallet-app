import { fetchMarket as fetchMarketSnapshot } from "./providers/market.server";
import { fetchTrades } from "./providers/geckoterminal.server";
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

export const DEFAULT_THRESHOLDS: AlertThresholds = {
  minTradeUsd: 250,
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
    minTradeUsd: env("XNOVA_ALERT_MIN_TRADE_USD", DEFAULT_THRESHOLDS.minTradeUsd),
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
    const trades = await fetchTrades(cfg.minTradeUsd);
    scanned = trades.length;
    const fresh = trades
      .filter((t) => !state.seen.has(t.id) && t.timestamp > state.lastTradeTs)
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-10);

    // First run only primes the cursor so history is not replayed into chat.
    if (state.lastTradeTs === 0) {
      for (const t of trades) state.seen.add(t.id);
      state.lastTradeTs = trades[0]?.timestamp ?? Date.now();
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
