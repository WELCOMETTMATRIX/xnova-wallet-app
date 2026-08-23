import { XNOVA, formatUsd, shortAddress, solscanTx } from "./config";
import type { Trade } from "./types";
import { telegramChatId, telegramToken } from "./env.server";

export function telegramConfigured(): boolean {
  return Boolean(telegramToken() && telegramChatId());
}

function token(): string {
  const t = telegramToken();
  if (!t) throw new Error("Telegram bot token is not configured");
  return t;
}

export async function sendTelegram(text: string, chatId?: string): Promise<void> {
  const chat = chatId ?? telegramChatId();
  if (!chat) throw new Error("Telegram chat id is not configured");
  const res = await fetch(`https://api.telegram.org/bot${token()}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: chat,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Telegram API ${res.status}: ${body.slice(0, 200)}`);
  }
  const payload = (await res.json()) as { ok?: boolean; description?: string };
  if (payload.ok === false) throw new Error(`Telegram error: ${payload.description ?? "unknown"}`);
}

export function formatTradeAlert(trade: Trade, whale: boolean): string {
  const dir = trade.kind === "buy" ? "BUY" : "SELL";
  const icon = trade.kind === "buy" ? "🟢" : "🔴";
  const head = whale ? `🚨 <b>XNOVA WHALE ALERT</b>` : `${icon} <b>XNOVA ${dir}</b>`;
  const lines = [
    head,
    ``,
    `Type: <b>${dir}</b>`,
    `Value: <b>${formatUsd(trade.valueUsd)}</b>`,
    `Amount: <b>${trade.amountToken.toLocaleString("en-US", { maximumFractionDigits: 0 })} XNOVA</b>`,
    `Price: ${formatUsd(trade.priceUsd, 8)}`,
    `Wallet: <code>${shortAddress(trade.wallet)}</code>`,
    ``,
    trade.txHash ? `<a href="${solscanTx(trade.txHash)}">View Transaction →</a>` : "",
    `<a href="${XNOVA.links.dexscreener}">DexScreener</a> · <a href="${XNOVA.website}">XNOVA Terminal</a>`,
  ];
  return lines.filter(Boolean).join("\n");
}

export function formatPriceAlert(
  label: string,
  message: string,
): string {
  return [`⚡ <b>XNOVA ${label}</b>`, ``, message, ``, `<a href="${XNOVA.website}">Open Terminal →</a>`].join(
    "\n",
  );
}
