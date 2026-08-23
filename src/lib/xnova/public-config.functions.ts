import { createServerFn } from "@tanstack/react-start";

/** Non-secret runtime configuration exposed to the browser. */
export const getPublicConfig = createServerFn({ method: "GET" }).handler(async () => ({
  thirdwebClientId: process.env["THIRDWEB_CLIENT_ID"] ?? "",
  solscanConfigured: Boolean(process.env["SOLSCAN_API_KEY"]),
  telegramConfigured: Boolean(
    process.env["TELEGRAM_BOT_TOKEN"] && process.env["TELEGRAM_CHAT_ID"],
  ),
  solanaRpcConfigured: Boolean(process.env["SOLANA_RPC_URL"]),
}));
