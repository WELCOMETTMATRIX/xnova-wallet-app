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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function once<T>(url: string, init?: RequestInit & { timeoutMs?: number }): Promise<T> {
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
      const error = new Error(`HTTP ${res.status} ${res.statusText} ${body.slice(0, 200)}`);
      (error as Error & { status?: number }).status = res.status;
      throw error;
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

/** JSON GET with bounded retry/backoff on rate limits and transient upstream errors. */
export async function getJson<T>(
  url: string,
  init?: RequestInit & { timeoutMs?: number; retries?: number },
): Promise<T> {
  const retries = init?.retries ?? 2;
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await once<T>(url, init);
    } catch (error) {
      lastError = error;
      const status = (error as Error & { status?: number }).status;
      const retryable = status === 429 || status === undefined || (status >= 500 && status < 600);
      if (!retryable || attempt === retries) break;
      await sleep(400 * 2 ** attempt + Math.random() * 200);
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Request failed");
}
