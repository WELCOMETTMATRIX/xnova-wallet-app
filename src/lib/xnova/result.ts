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

/** Reject after `ms` so a slow provider degrades to an unavailable state
 * instead of blowing the request budget and returning a 500. */
export function withTimeout<T>(ms: number, loader: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timed out after ${ms}ms`)), ms);
    loader().then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}
