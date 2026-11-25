// Minimal Supabase (PostgREST + Auth) client for server functions. Uses the service-role key,
// which must only ever exist in server-side environment variables.
import { env, HttpError } from "./http.js";

type Query = Record<string, string>;

function base() {
  return env("SUPABASE_URL").replace(/\/$/, "");
}
function serviceHeaders(extra: Record<string, string> = {}) {
  const key = env("SUPABASE_SERVICE_ROLE_KEY");
  return { apikey: key, authorization: `Bearer ${key}`, "content-type": "application/json", ...extra };
}

async function rest<T>(method: string, table: string, query: Query = {}, body?: unknown, prefer?: string): Promise<T> {
  const url = new URL(`${base()}/rest/v1/${table}`);
  for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v);
  const res = await fetch(url, {
    method,
    headers: serviceHeaders(prefer ? { prefer } : {}),
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`[supabase] ${method} ${table} ${res.status}: ${text}`);
    if (res.status === 409) throw new HttpError(409, "conflict", "Duplicate record.");
    throw new HttpError(502, "db_error", "Database error. Please try again.");
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const db = {
  select: <T>(table: string, query: Query) => rest<T[]>("GET", table, query),
  insert: <T>(table: string, row: unknown) => rest<T[]>("POST", table, {}, row, "return=representation"),
  upsert: <T>(table: string, row: unknown) =>
    rest<T[]>("POST", table, {}, row, "return=representation,resolution=merge-duplicates"),
  update: <T>(table: string, query: Query, patch: unknown) => rest<T[]>("PATCH", table, query, patch, "return=representation"),
};

/** Verifies a Supabase Auth access token and checks the user is listed in admin_users. */
export async function requireAdmin(req: Request): Promise<{ id: string; email: string }> {
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) throw new HttpError(401, "unauthorized", "Please sign in.");
  const res = await fetch(`${base()}/auth/v1/user`, {
    headers: { apikey: env("SUPABASE_SERVICE_ROLE_KEY"), authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new HttpError(401, "unauthorized", "Your session has expired. Please sign in again.");
  const user = (await res.json()) as { id: string; email: string };
  const rows = await db.select<{ user_id: string }>("admin_users", { select: "user_id", user_id: `eq.${user.id}` });
  if (!rows.length) throw new HttpError(403, "forbidden", "This account is not an admin.");
  return user;
}
