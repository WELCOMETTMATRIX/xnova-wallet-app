import { solscanKey } from "./env.server";
import { XNOVA, formatNum, formatPct, formatUsd, shortAddress, solscanTx } from "./config";
import { fetchMarket as fetchMarketSnapshot } from "./providers/market.server";
import { fetchChainTrades } from "./providers/chain-trades.server";
import { fetchTokenMeta, fetchTopHolders } from "./providers/solscan.server";
import { sendTelegram } from "./telegram.server";
import { chatWithAi } from "./ai.server";

const UNAVAILABLE = "Data temporarily unavailable.";

/** Surface the upstream reason so a failing source is diagnosable from chat. */
function unavailable(error: unknown): string {
  const detail = error instanceof Error ? error.message : String(error ?? "");
  return detail ? `${UNAVAILABLE}\n<code>${detail.slice(0, 220)}</code>` : UNAVAILABLE;
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
  "/whales — recent $1+ transactions",
  "/alerts — automatic alert engine status",
  "/watch — show automatic alert routing",
  "/unwatch — show automatic alert routing",
  "/status — data source status",
].join("\n");

async function reply(chatId: string, text: string) {
  await sendTelegram(text, chatId);
}

const WELCOME = `<b>Welcome to XNOVA.</b>\n\nYou are connected to the XNOVA Solana intelligence terminal. I can help you navigate live market data, token identity, holder intelligence, whale activity, alerts and the terminal tools.\n\nUse /help to see commands, or ask a question directly. Never share a seed phrase or private key.`;

async function welcome(chatId: string, name?: string) {
  const safeName = name?.replace(/[<>]/g, "");
  await reply(chatId, safeName ? `<b>Welcome, ${safeName}</b>\n\n${WELCOME}` : WELCOME);
}

async function command(cmd: string, chatId: string) {
  switch (cmd) {
    case "/start":
      await welcome(chatId);
      return reply(chatId, `<b>XNOVA TERMINAL</b>\nSolana Web3 intelligence, alerts and analytics.\n\n${HELP}`);
    case "/help":
      return reply(chatId, HELP);
    case "/token": {
      let meta = "";
      try {
        const m = await fetchTokenMeta();
        meta = `\nSupply: <b>${formatNum(m.supply)}</b>\nDecimals: ${m.decimals ?? "—"}\nHolders: <b>${formatNum(m.holders)}</b>`;
      } catch (error) {
        meta = `\n${unavailable(error)}`;
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
      } catch (error) {
        return reply(chatId, unavailable(error));
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
      } catch (error) {
        return reply(chatId, unavailable(error));
      }
    }
    case "/volume": {
      try {
        const m = await fetchMarketSnapshot();
        return reply(
          chatId,
          `<b>XNOVA VOLUME (24h)</b>\nVolume: <b>${formatUsd(m.volume24h)}</b>\nBuys: ${formatNum(m.txns24h.buys)}\nSells: ${formatNum(m.txns24h.sells)}`,
        );
      } catch (error) {
        return reply(chatId, unavailable(error));
      }
    }
    case "/liquidity": {
      try {
        const m = await fetchMarketSnapshot();
        return reply(
          chatId,
          `<b>XNOVA LIQUIDITY</b>\nPool: <b>${formatUsd(m.liquidityUsd)}</b>\nDex: ${m.dexId ?? "—"}\nPair: <code>${m.pairAddress}</code>`,
        );
      } catch (error) {
        return reply(chatId, unavailable(error));
      }
    }
    case "/whales": {
      try {
        const trades = (await fetchChainTrades(30)).filter((t) => t.valueUsd >= 1).slice(0, 8);
        if (trades.length === 0) return reply(chatId, "No $1+ transactions in the recent window.");
        const rows = trades
          .map(
            (t) =>
              `${t.kind === "buy" ? "🟢 BUY " : "🔴 SELL"} ${formatUsd(t.valueUsd)} · <code>${shortAddress(t.wallet)}</code>${t.txHash ? ` · <a href="${solscanTx(t.txHash)}">tx</a>` : ""}`,
          )
          .join("\n");
        return reply(chatId, `<b>XNOVA WHALE ACTIVITY</b>\n\n${rows}`);
      } catch (error) {
        return reply(chatId, unavailable(error));
      }
    }
    case "/alerts":
      return reply(
        chatId,
        `<b>XNOVA ALERTS</b>\nBuy / sell notifications, whale alerts and price-move alerts are pushed automatically by the AI engine.\n\nMin trade: $1\nMax trade: none\nWhale threshold: $${process.env["XNOVA_ALERT_WHALE_USD"] ?? 5000}\nPrice move: ${process.env["XNOVA_ALERT_PRICE_PCT"] ?? 10}%\n\nUsers cannot manage alert thresholds from Telegram.`,
      );
    case "/watch":
    case "/unwatch":
      return reply(
        chatId,
        "XNOVA alerts are automatic and read-only. The AI engine sends every $1+ transaction to the configured Telegram destination with no maximum cap.",
      );
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
  const payload = update as {
    message?: {
      chat?: { id?: number | string };
      text?: string;
      new_chat_members?: Array<{ first_name?: string; username?: string }>;
    };
    chat_member?: {
      chat?: { id?: number | string };
      new_chat_member?: { status?: string; user?: { first_name?: string; username?: string } };
    };
  };
  const msg = payload.message;
  const chatId = msg?.chat?.id;
  if (chatId == null) {
    const member = payload.chat_member;
    const memberChatId = member?.chat?.id;
    const status = member?.new_chat_member?.status;
    if (memberChatId != null && (status === "member" || status === "administrator")) {
      const user = member?.new_chat_member?.user;
      await welcome(String(memberChatId), user?.first_name ?? user?.username);
    }
    return;
  }

  if (msg?.new_chat_members?.length) {
    for (const member of msg.new_chat_members) {
      await welcome(String(chatId), member.first_name ?? member.username);
    }
  }

  const text = msg?.text;
  if (typeof text !== "string") return;
  const trimmed = text.trim();
  const cmd = trimmed.split(/\s+/)[0]?.split("@")[0]?.toLowerCase();
  if (cmd?.startsWith("/")) {
    await command(cmd, String(chatId));
    return;
  }

  if (trimmed.length > 0) {
    try {
      const response = await chatWithAi([{ role: "user", content: trimmed }]);
      await reply(String(chatId), response);
    } catch (error) {
      await reply(String(chatId), "AI is temporarily unavailable. Use /help for the terminal commands.");
      console.error("[xnova:telegram-ai]", error instanceof Error ? error.message : error);
    }
  }
}
