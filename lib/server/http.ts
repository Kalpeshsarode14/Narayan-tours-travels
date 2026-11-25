import { ValidationError } from "../booking/validation.js";
import { FareError } from "../booking/fare-engine.js";

export class HttpError extends Error {
  constructor(public status: number, public code: string, message: string, public extra?: Record<string, unknown>) {
    super(message);
  }
}

export function json(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      ...headers,
    },
  });
}

export async function readJson(req: Request, maxBytes = 32_000): Promise<unknown> {
  const ct = req.headers.get("content-type") || "";
  if (!ct.includes("application/json")) throw new HttpError(415, "bad_content_type", "Expected JSON.");
  const text = await req.text();
  if (text.length > maxBytes) throw new HttpError(413, "too_large", "Request is too large.");
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(400, "bad_json", "Malformed JSON.");
  }
}

/** Wraps a handler so every error becomes a clean JSON response and internals are never leaked. */
export function handle(fn: (req: Request) => Promise<Response>) {
  return async (req: Request): Promise<Response> => {
    try {
      return await fn(req);
    } catch (e) {
      if (e instanceof ValidationError) return json({ error: "validation", message: e.message, fields: e.fields }, 400);
      if (e instanceof FareError) return json({ error: e.code, message: e.message }, 422);
      if (e instanceof HttpError) return json({ error: e.code, message: e.message, ...e.extra }, e.status);
      console.error("[api] unexpected error", e);
      return json({ error: "server_error", message: "Something went wrong. Please try again or call us." }, 500);
    }
  };
}

export function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new HttpError(503, "not_configured", `Server is not configured (${name} missing).`);
  return v;
}

export function clientIp(req: Request): string {
  return (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
}

// Best-effort per-instance rate limiter. Use Vercel Firewall rate-limit rules for a hard global limit.
const buckets = new Map<string, { count: number; reset: number }>();
export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    if (buckets.size > 5000) for (const [k, v] of buckets) if (v.reset < now) buckets.delete(k);
    return;
  }
  b.count++;
  if (b.count > limit) throw new HttpError(429, "rate_limited", "Too many requests. Please wait a minute and try again.");
}
