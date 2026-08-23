/** Small cached fetch helper used by every server-side data provider. */

type Entry = { expires: number; value: unknown };
const cache = new Map<string, Entry>();

export async function cachedJson<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>,
): Promise<T> {
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value as T;
  const value = await loader();
  cache.set(key, { expires: Date.now() + ttlMs, value });
  if (cache.size > 200) {
    for (const [k, v] of cache) if (v.expires < Date.now()) cache.delete(k);
  }
  return value;
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
