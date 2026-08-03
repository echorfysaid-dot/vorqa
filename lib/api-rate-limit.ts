export type ApiRateLimitScope = "user" | "ip" | "endpoint";

export type ApiRateLimitConfig = Readonly<{
  limit: number;
  windowMs: number;
  scope: ApiRateLimitScope;
}>;

export type ApiRateLimitResult = Readonly<{
  allowed: boolean;
  remaining: number;
  resetAt: number;
  key: string;
  safeFallback: boolean;
}>;

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

function nowMs(now?: Date) {
  return now ? now.getTime() : Date.now();
}

function scopedKey(input: { userId?: string; ip?: string; endpoint: string; scope: ApiRateLimitScope }) {
  if (input.scope === "user") return `user:${input.userId || "anonymous"}:${input.endpoint}`;
  if (input.scope === "ip") return `ip:${input.ip || "local"}:${input.endpoint}`;
  return `endpoint:${input.endpoint}`;
}

export function checkApiRateLimit(input: {
  userId?: string;
  ip?: string;
  endpoint: string;
  config?: Partial<ApiRateLimitConfig>;
  internal?: boolean;
  now?: Date;
}): ApiRateLimitResult {
  const config: ApiRateLimitConfig = {
    limit: Math.max(1, input.config?.limit || 60),
    windowMs: Math.max(1000, input.config?.windowMs || 60_000),
    scope: input.config?.scope || "user"
  };
  const key = scopedKey({ userId: input.userId, ip: input.ip, endpoint: input.endpoint, scope: config.scope });
  const now = nowMs(input.now);

  if (input.internal) {
    return Object.freeze({ allowed: true, remaining: config.limit, resetAt: now + config.windowMs, key, safeFallback: true });
  }

  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + config.windowMs });
    return Object.freeze({ allowed: true, remaining: config.limit - 1, resetAt: now + config.windowMs, key, safeFallback: false });
  }

  current.count += 1;
  return Object.freeze({
    allowed: current.count <= config.limit,
    remaining: Math.max(config.limit - current.count, 0),
    resetAt: current.resetAt,
    key,
    safeFallback: false
  });
}

export function resetApiRateLimits() {
  buckets.clear();
}
