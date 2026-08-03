type CacheRecord<T> = Readonly<{
  value: T;
  expiresAt: number;
}>;

export type RequestCacheStats = Readonly<{
  size: number;
  hits: number;
  misses: number;
  sets: number;
  hitRate: number;
}>;

const store = new Map<string, CacheRecord<unknown>>();
let hits = 0;
let misses = 0;
let sets = 0;

function nowMs(now?: Date) {
  return now ? now.getTime() : Date.now();
}

export function get<T>(key: string, now?: Date): T | undefined {
  const record = store.get(key) as CacheRecord<T> | undefined;
  if (!record || record.expiresAt <= nowMs(now)) {
    if (record) store.delete(key);
    misses += 1;
    return undefined;
  }
  hits += 1;
  return record.value;
}

export function set<T>(key: string, value: T, ttlMs = 30_000, now?: Date): T {
  sets += 1;
  store.set(key, Object.freeze({ value, expiresAt: nowMs(now) + Math.max(1, ttlMs) }));
  return value;
}

export function invalidate(key: string) {
  return store.delete(key);
}

export function clear() {
  store.clear();
  hits = 0;
  misses = 0;
  sets = 0;
}

export function stats(): RequestCacheStats {
  const total = hits + misses;
  return Object.freeze({
    size: store.size,
    hits,
    misses,
    sets,
    hitRate: total ? Number((hits / total).toFixed(4)) : 0
  });
}

export const requestCache = Object.freeze({ get, set, invalidate, clear, stats });
