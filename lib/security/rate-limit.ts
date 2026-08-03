import { NextResponse } from "next/server";

export type RateLimitBucket = "auth" | "ai" | "upload" | "search" | "messaging" | "default";
export type RateLimitProvider = "memory" | "upstash";

type BucketRecord = {
  count: number;
  resetAt: number;
};

const store = new Map<string, BucketRecord>();

const policies: Record<RateLimitBucket, { limit: number; windowMs: number }> = {
  auth: { limit: 12, windowMs: 60_000 },
  ai: { limit: 20, windowMs: 60_000 },
  upload: { limit: 30, windowMs: 60_000 },
  search: { limit: 120, windowMs: 60_000 },
  messaging: { limit: 60, windowMs: 60_000 },
  default: { limit: 80, windowMs: 60_000 }
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  provider: RateLimitProvider;
};

export function getClientKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  return forwarded || realIp || "local";
}

function getProvider(): RateLimitProvider {
  if (process.env.RATE_LIMIT_PROVIDER === "upstash" && process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    return "upstash";
  }
  return "memory";
}

function memoryRateLimit(key: string, bucket: RateLimitBucket): RateLimitResult {
  const policy = policies[bucket] || policies.default;
  const now = Date.now();
  const current = store.get(key);

  if (!current || current.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + policy.windowMs });
    return { allowed: true, remaining: policy.limit - 1, resetAt: now + policy.windowMs, provider: "memory" };
  }

  current.count += 1;
  if (current.count > policy.limit) {
    return { allowed: false, remaining: 0, resetAt: current.resetAt, provider: "memory" };
  }

  return { allowed: true, remaining: policy.limit - current.count, resetAt: current.resetAt, provider: "memory" };
}

async function upstashRateLimit(key: string, bucket: RateLimitBucket): Promise<RateLimitResult> {
  const policy = policies[bucket] || policies.default;
  const baseUrl = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!baseUrl || !token) return memoryRateLimit(key, bucket);

  const redisKey = `vorqa:rate:${key}`;
  const response = await fetch(`${baseUrl.replace(/\/+$/, "")}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify([
      ["INCR", redisKey],
      ["PEXPIRE", redisKey, String(policy.windowMs), "NX"],
      ["PTTL", redisKey]
    ]),
    cache: "no-store"
  });

  if (!response.ok) return memoryRateLimit(key, bucket);
  const payload = (await response.json()) as Array<{ result?: number }>;
  const count = Number(payload[0]?.result || 1);
  const ttl = Math.max(Number(payload[2]?.result || policy.windowMs), 1);
  const resetAt = Date.now() + ttl;
  return {
    allowed: count <= policy.limit,
    remaining: Math.max(policy.limit - count, 0),
    resetAt,
    provider: "upstash"
  };
}

export async function checkRateLimitAsync(request: Request, bucket: RateLimitBucket): Promise<RateLimitResult> {
  const key = `${bucket}:${getClientKey(request)}`;
  if (getProvider() === "upstash") {
    try {
      return await upstashRateLimit(key, bucket);
    } catch {
      return memoryRateLimit(key, bucket);
    }
  }
  return memoryRateLimit(key, bucket);
}

export function checkRateLimit(request: Request, bucket: RateLimitBucket): RateLimitResult {
  const key = `${bucket}:${getClientKey(request)}`;
  return memoryRateLimit(key, bucket);
}

export function rateLimitResponse(resetAt: number) {
  const retryAfter = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
  return NextResponse.json(
    { error: "Too many requests. Please try again shortly.", code: "RATE_LIMITED" },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter)
      }
    }
  );
}
