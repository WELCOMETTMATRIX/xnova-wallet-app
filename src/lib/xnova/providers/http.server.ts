/**
 * Small cached fetch helper used by every server-side data provider.
 *
 * - TTL cache: keeps upstream request volume inside public API rate limits.
 * - In-flight dedupe: concurrent callers share one upstream request.
 * - Stale-on-error: if an upstream call fails (e.g. a 429 burst), the last good
 *   value is served for a grace window instead of blanking the terminal.
 */

type Entry = { expires: number; staleUntil: number; value: unknown };

const cache = new Map<string, Entry>();
const inflight = new Map<string, Promise<unknown>>();

const STALE_GRACE_MS = 10 * 60_000;

export async function cachedJson<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>,
): Promise<T> {
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && hit.expires > now) return hit.value as T;

  const pending = inflight.get(key);
  if (pending) return pending as Promise<T>;

  const request = (async () => {
    try {
      const value = await loader();
      cache.set(key, {
        value,
        expires: Date.now() + ttlMs,
        staleUntil: Date.now() + ttlMs + STALE_GRACE_MS,
      });
      if (cache.size > 200) {
        for (const [k, v] of cache) if (v.staleUntil < Date.now()) cache.delete(k);
      }
      return value;
    } catch (error) {
      const stale = cache.get(key);
      if (stale && stale.staleUntil > Date.now()) return stale.value as T;
      throw error;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, request);
  return request;
}

export async function getJson<T>(
  url: string,
  init?: RequestInit & { timeoutMs?: number },
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), init?.timeoutMs ?? 10_000);
  try {
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: { accept: "application/json", ...(init?.headers ?? {}) },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} ${res.statusText} ${body.slice(0, 200)}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}
