import { solscanKey } from "./env.server";
import { XNOVA, formatNum, formatPct, formatUsd, shortAddress, solscanTx } from "./config";
import { fetchMarket as fetchMarketSnapshot } from "./providers/market.server";
import { fetchTrades } from "./providers/geckoterminal.server";
import { fetchTokenMeta, fetchTopHolders } from "./providers/solscan.server";
import { sendTelegram } from "./telegram.server";

const UNAVAILABLE = "Data temporarily unavailable.";

/** Chats subscribed via /watch (in-memory; wire to a store for persistence). */
const watchers = new Set<string>();

export function watcherChats(): string[] {
  return [...watchers];
}

const HELP = [
  "<b>XNOVA — SOLANA WEB3 INTELLIGENCE TERMINAL</b>",
  "",
  "/token — token identity and supply",
  "/price — live price and 24h change",
  "/chart — open the live chart",
  "/holders — top holders",
  "/volume — 24h volume and trade counts",
  "/liquidity — pool liquidity",
  "/whales — recent large transactions",
  "/alerts — alert configuration",
  "/watch — subscribe this chat to alerts",
  "/unwatch — unsubscribe this chat",
  "/status — data source status",
].join("\n");

async function reply(chatId: string, text: string) {
  await sendTelegram(text, chatId);
}

async function command(cmd: string, chatId: string) {
  switch (cmd) {
    case "/start":
      return reply(
        chatId,
        `<b>XNOVA TERMINAL</b>\nSolana Web3 intelligence, alerts and analytics.\n\n${HELP}`,
      );
    case "/help":
      return reply(chatId, HELP);
    case "/token": {
      let meta = "";
      try {
        const m = await fetchTokenMeta();
        meta = `\nSupply: <b>${formatNum(m.supply)}</b>\nDecimals: ${m.decimals ?? "—"}\nHolders: <b>${formatNum(m.holders)}</b>`;
      } catch {
        meta = `\n${UNAVAILABLE}`;
      }
      return reply(
        chatId,
        `<b>XNOVA</b>\nNetwork: Solana Mainnet\nMint: <code>${XNOVA.tokenMint}</code>\nPair: <code>${XNOVA.primaryPair}</code>${meta}\n\n<a href="${XNOVA.links.solscan}">Solscan</a> · <a href="${XNOVA.links.dexscreener}">DexScreener</a> · <a href="${XNOVA.links.pumpfun}">Pump.fun</a>`,
      );
    }
    case "/price": {
      try {
        const m = await fetchMarketSnapshot();
        return reply(
          chatId,
          `<b>XNOVA PRICE</b>\nPrice: <b>${formatUsd(m.priceUsd, 8)}</b>\n1h: ${formatPct(m.change.h1)}\n24h: ${formatPct(m.change.h24)}\nMarket cap: ${formatUsd(m.marketCap)}`,
        );
      } catch {
        return reply(chatId, UNAVAILABLE);
      }
    }
    case "/chart":
      return reply(
        chatId,
        `<b>XNOVA CHART</b>\n<a href="${XNOVA.website}">Terminal chart →</a>\n<a href="${XNOVA.links.dexscreener}">DexScreener →</a>`,
      );
    case "/holders": {
      try {
        const { holders, total } = await fetchTopHolders(10);
        const rows = holders
          .map(
            (h) =>
              `${String(h.rank).padStart(2, "0")} <code>${shortAddress(h.address)}</code> ${formatNum(h.amount)}${h.share != null ? ` (${h.share.toFixed(2)}%)` : ""}`,
          )
          .join("\n");
        return reply(chatId, `<b>XNOVA TOP HOLDERS</b>\nTotal: ${formatNum(total)}\n\n${rows}`);
      } catch {
        return reply(chatId, UNAVAILABLE);
      }
    }
    case "/volume": {
      try {
        const m = await fetchMarketSnapshot();
        return reply(
          chatId,
          `<b>XNOVA VOLUME (24h)</b>\nVolume: <b>${formatUsd(m.volume24h)}</b>\nBuys: ${formatNum(m.txns24h.buys)}\nSells: ${formatNum(m.txns24h.sells)}`,
        );
      } catch {
        return reply(chatId, UNAVAILABLE);
      }
    }
    case "/liquidity": {
      try {
        const m = await fetchMarketSnapshot();
        return reply(
          chatId,
          `<b>XNOVA LIQUIDITY</b>\nPool: <b>${formatUsd(m.liquidityUsd)}</b>\nDex: ${m.dexId ?? "—"}\nPair: <code>${m.pairAddress}</code>`,
        );
      } catch {
        return reply(chatId, UNAVAILABLE);
      }
    }
    case "/whales": {
      try {
        const trades = (await fetchTrades(2500)).slice(0, 8);
        if (trades.length === 0) return reply(chatId, "No large transactions in the recent window.");
        const rows = trades
          .map(
            (t) =>
              `${t.kind === "buy" ? "🟢 BUY " : "🔴 SELL"} ${formatUsd(t.valueUsd)} · <code>${shortAddress(t.wallet)}</code>${t.txHash ? ` · <a href="${solscanTx(t.txHash)}">tx</a>` : ""}`,
          )
          .join("\n");
        return reply(chatId, `<b>XNOVA WHALE ACTIVITY</b>\n\n${rows}`);
      } catch {
        return reply(chatId, UNAVAILABLE);
      }
    }
    case "/alerts":
      return reply(
        chatId,
        `<b>XNOVA ALERTS</b>\nBuy / sell notifications, whale alerts and price-move alerts are pushed automatically.\n\nMin trade: $${process.env["XNOVA_ALERT_MIN_TRADE_USD"] ?? 250}\nWhale threshold: $${process.env["XNOVA_ALERT_WHALE_USD"] ?? 5000}\nPrice move: ${process.env["XNOVA_ALERT_PRICE_PCT"] ?? 10}%\n\nUse /watch to receive them in this chat.`,
      );
    case "/watch":
      watchers.add(chatId);
      return reply(chatId, "✅ This chat is now watching XNOVA activity.");
    case "/unwatch":
      watchers.delete(chatId);
      return reply(chatId, "Unsubscribed from XNOVA alerts.");
    case "/status": {
      const market = await fetchMarketSnapshot().then(
        () => "DexScreener: online",
        () => "DexScreener: unavailable",
      );
      const solscan = solscanKey()
        ? await fetchTokenMeta().then(
            () => "Solscan: online",
            () => "Solscan: unavailable",
          )
        : "Solscan: not configured";
      return reply(chatId, `<b>XNOVA STATUS</b>\n${market}\n${solscan}\nTelegram: online`);
    }
    default:
      return reply(chatId, `Unknown command.\n\n${HELP}`);
  }
}

export async function handleTelegramUpdate(update: unknown): Promise<void> {
  const msg = (update as { message?: { chat?: { id?: number | string }; text?: string } }).message;
  const chatId = msg?.chat?.id;
  const text = msg?.text;
  if (chatId == null || typeof text !== "string") return;
  const cmd = text.trim().split(/\s+/)[0]?.split("@")[0]?.toLowerCase();
  if (!cmd || !cmd.startsWith("/")) return;
  await command(cmd, String(chatId));
}
