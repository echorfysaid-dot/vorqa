type CacheEntry<T> = {
  expiresAt: number;
  value: Promise<T>;
};

const cache = new Map<string, CacheEntry<unknown>>();

export function cachedRepositoryCall<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const current = cache.get(key) as CacheEntry<T> | undefined;
  if (current && current.expiresAt > now) return current.value;

  const value = loader().catch((error) => {
    cache.delete(key);
    throw error;
  });
  cache.set(key, { value, expiresAt: now + ttlMs });
  return value;
}

export function clearRepositoryCache(prefix?: string) {
  if (!prefix) {
    cache.clear();
    return;
  }

  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}
