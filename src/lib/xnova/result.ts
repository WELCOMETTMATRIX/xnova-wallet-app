import type { DataResult } from "./types";

/** Wrap a provider call so the UI can render an explicit unavailable state
 * instead of ever showing fabricated data. */
export async function attempt<T>(source: string, loader: () => Promise<T>): Promise<DataResult<T>> {
  try {
    return { ok: true, data: await loader(), source, fetchedAt: Date.now() };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[xnova:${source}]`, message);
    return { ok: false, error: message, source, fetchedAt: Date.now() };
  }
}
