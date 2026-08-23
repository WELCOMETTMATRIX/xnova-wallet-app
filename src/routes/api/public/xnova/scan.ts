import { createFileRoute } from "@tanstack/react-router";

/**
 * Cron endpoint. Call every 1-2 minutes (pg_cron / external scheduler) with
 * header `x-xnova-secret: $TELEGRAM_WEBHOOK_SECRET` to push buy/sell alerts.
 */
async function handle(request: Request) {
  const secret = process.env["TELEGRAM_WEBHOOK_SECRET"];
  if (!secret) return new Response("Scanner secret not configured", { status: 503 });
  if (request.headers.get("x-xnova-secret") !== secret) {
    return new Response("Unauthorized", { status: 401 });
  }
  try {
    const { runAlertScan } = await import("@/lib/xnova/alerts.server");
    const result = await runAlertScan();
    return Response.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[xnova:scan]", message);
    return Response.json({ ok: false, error: message }, { status: 502 });
  }
}

export const Route = createFileRoute("/api/public/xnova/scan")({
  server: {
    handlers: {
      GET: ({ request }) => handle(request),
      POST: ({ request }) => handle(request),
    },
  },
});
