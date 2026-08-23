import { createFileRoute } from "@tanstack/react-router";

/**
 * Telegram bot webhook. Register with:
 * https://api.telegram.org/bot<TOKEN>/setWebhook?url=<APP>/api/public/telegram/webhook&secret_token=<TELEGRAM_WEBHOOK_SECRET>
 */
export const Route = createFileRoute("/api/public/telegram/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["TELEGRAM_WEBHOOK_SECRET"];
        if (!secret) return new Response("Webhook secret not configured", { status: 503 });
        if (request.headers.get("x-telegram-bot-api-secret-token") !== secret) {
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
