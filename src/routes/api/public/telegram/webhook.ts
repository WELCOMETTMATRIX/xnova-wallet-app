import { createFileRoute } from "@tanstack/react-router";
import { telegramApiKey, telegramWebhookSecret } from "@/lib/xnova/env.server";

/**
 * Telegram bot webhook.
 *
 * The webhook secret is derived from the connector API key so the endpoint
 * can be verified without exposing the raw bot token. Register with Telegram
 * via the Lovable connector gateway using setWebhook.
 */
export const Route = createFileRoute("/api/public/telegram/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!telegramApiKey()) {
          return new Response("Telegram not configured", { status: 503 });
        }
        const expected = telegramWebhookSecret();
        const actual = request.headers.get("x-telegram-bot-api-secret-token") ?? "";
        if (actual !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }

        let update: unknown;
        try {
          update = await request.json();
        } catch {
          return new Response("Bad request", { status: 400 });
        }

        try {
          const { handleTelegramUpdate } = await import("@/lib/xnova/bot.server");
          await handleTelegramUpdate(update);
        } catch (error) {
          console.error("[xnova:telegram]", error instanceof Error ? error.message : error);
        }
        // Always ack so Telegram does not retry-storm the endpoint.
        return Response.json({ ok: true });
      },
    },
  },
});
