import { XNOVA, formatUsd, shortAddress, solscanTx } from "./config";
import type { Trade } from "./types";
import { lovableApiKey, telegramApiKey, telegramChatId } from "./env.server";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";
const TELEGRAM_API_URL = "https://api.telegram.org/bot";

export function telegramConfigured(): boolean {
  return Boolean(telegramApiKey() && telegramChatId() && (lovableApiKey() || telegramApiKey()));
}

function apiKey(): string {
  const key = telegramApiKey();
  if (!key) throw new Error("Telegram API key is not configured");
  return key;
}

function lovableKey(): string {
  const key = lovableApiKey();
  if (!key) throw new Error("LOVABLE_API_KEY is not configured");
  return key;
}

export async function sendTelegram(text: string, chatId?: string): Promise<void> {
  const chat = chatId ?? telegramChatId();
  if (!chat) throw new Error("Telegram chat id is not configured");

  const useLovableGateway = Boolean(lovableApiKey());
  const res = await fetch(
    useLovableGateway ? `${GATEWAY_URL}/sendMessage` : `${TELEGRAM_API_URL}${apiKey()}/sendMessage`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(useLovableGateway
          ? {
              Authorization: `Bearer ${lovableKey()}`,
              "X-Connection-Api-Key": apiKey(),
            }
          : {}),
      },
      body: JSON.stringify({
        chat_id: chat,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    },
  );

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Telegram gateway ${res.status}: ${body.slice(0, 200)}`);
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

export function formatPriceAlert(label: string, message: string): string {
  return [
    `⚡ <b>XNOVA ${label}</b>`,
    ``,
    message,
    ``,
    `<a href="${XNOVA.website}">Open Terminal →</a>`,
  ].join("\n");
}
