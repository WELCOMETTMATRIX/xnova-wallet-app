import { createServerFn } from "@tanstack/react-start";

/** Non-secret runtime configuration exposed to the browser. */
export const getPublicConfig = createServerFn({ method: "GET" }).handler(async () => {
  const { solscanKey, telegramChatId, telegramApiKey, thirdwebClientId, env } =
    await import("./env.server");
  return {
    thirdwebClientId: thirdwebClientId() ?? "",
    solscanConfigured: Boolean(solscanKey()),
    telegramConfigured: Boolean(telegramApiKey() && telegramChatId()),
    telegramBotConfigured: Boolean(telegramApiKey()),
    solanaRpcConfigured: Boolean(env("SOLANA_RPC_URL", "HELIUS_RPC_URL", "QUICKNODE_RPC_URL")),
    aiConfigured: Boolean(env("LOVABLE_API_KEY")),
  };
});
