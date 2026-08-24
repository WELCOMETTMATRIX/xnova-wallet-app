import { createHash } from "crypto";

/**
 * Server-side environment resolution.
 *
 * Secrets can be stored under several conventional names depending on how the
 * project was provisioned (e.g. SOLSCAN_API vs SOLSCAN_API_KEY). Resolving a
 * list of aliases keeps the terminal working without renaming cloud secrets.
 */
export function env(...names: string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name];
    if (typeof value === "string" && value.trim().length > 0) return value.trim();
  }
  return undefined;
}

export const solscanKey = () =>
  env("SOLSCAN_API_KEY", "SOLSCAN_API", "SOLSCAN_TOKEN", "SOLSCAN_API_TOKEN");

export const thirdwebClientId = () =>
  env("THIRDWEB_CLIENT_ID", "THIRDWEB_PROJECT_ID", "VITE_THIRDWEB_CLIENT_ID");

export const thirdwebSecretKey = () => env("THIRDWEB_SECRET_KEY");

export const telegramApiKey = () =>
  env(
    "TELEGRAM_API_KEY",
    "TELEGRAM_BOT_TOKEN",
    "TELEGRAM_BOT",
    "TELEGRAM_TOKEN",
    "TELEGRAM_BOT_API_KEY",
  );

export const telegramChatId = () => env("TELEGRAM_CHAT_ID", "TELEGRAM_CHAT", "TELEGRAM_GROUP_ID");

export const lovableApiKey = () => env("LOVABLE_API_KEY");

export function telegramWebhookSecret(): string {
  const key = telegramApiKey();
  if (!key) throw new Error("Telegram API key is not configured");
  return createHash("sha256").update(`telegram-webhook:${key}`).digest("base64url");
}

export const solanaRpcUrl = () => solanaRpcUrls()[0]!;

/**
 * Ordered list of Solana RPC endpoints. A configured private endpoint always
 * wins; public endpoints act as rotation targets when one rate-limits.
 */
export function solanaRpcUrls(): string[] {
  const configured = env("SOLANA_RPC_URL", "HELIUS_RPC_URL", "QUICKNODE_RPC_URL");
  const publics = ["https://solana-rpc.publicnode.com", "https://api.mainnet-beta.solana.com"];
  return configured ? [configured, ...publics] : publics;
}
