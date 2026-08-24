import { createFileRoute } from "@tanstack/react-router";
import { fetchMarket } from "@/lib/xnova/providers/market.server";

/**
 * Public, read-only market snapshot for the XNOVA pair.
 * Contains no secrets and no user data; used for health checks and integrations.
 * Also keeps the automatic Telegram alert loop warm.
 */
export const Route = createFileRoute("/api/public/xnova/market")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const market = await fetchMarket();
          const { maybeRunAlertScan } = await import("@/lib/xnova/alerts.server");
          await maybeRunAlertScan();
          return Response.json({ ok: true, market });
        } catch (error) {
          return Response.json({ ok: false, error: (error as Error).message }, { status: 503 });
        }
      },
    },
  },
});
