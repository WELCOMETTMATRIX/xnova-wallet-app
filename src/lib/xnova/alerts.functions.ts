import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { attempt } from "./result";

export const getAlertStatus = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { alertState } = await import("./alerts.server");
    return alertState();
  } catch (error) {
    console.error(error);
    return {
      lastRunAt: 0,
      sent: 0,
      lastError: error instanceof Error ? error.message : "alert status unavailable",
      telegramConfigured: false,
    };
  }
});

export const triggerAlertScan = createServerFn({ method: "POST" }).handler(async () => {
  const { runAlertScan } = await import("./alerts.server");
  return attempt("alerts", runAlertScan);
});

export const sendTestAlert = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ message: z.string().trim().min(1).max(400) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { sendTelegram, formatPriceAlert } = await import("./telegram.server");
    return attempt("telegram", async () => {
      await sendTelegram(formatPriceAlert("TEST NOTIFICATION", data.message));
      return true;
    });
  });
