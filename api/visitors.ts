// POST /api/visitors  { id: string, isNew: boolean }  →  { total, live }
// Uses the existing Supabase service-role key (server only) to call public.track_visit.
import { handle, json, readJson, env, clientIp, rateLimit, HttpError } from "../lib/server/http.js";

export const POST = handle(async (req) => {
  const ip = clientIp(req);
  rateLimit(`visit:${ip}`, 20, 60_000);

  const body = (await readJson(req, 1_000)) as { id?: unknown; isNew?: unknown };
  const id = typeof body.id === "string" && /^[a-z0-9]{8,64}$/i.test(body.id) ? body.id : null;
  const isNew = body.isNew === true;
  if (isNew) rateLimit(`visit-new:${ip}`, 10, 10 * 60_000);

  const key = env("SUPABASE_SERVICE_ROLE_KEY");
  const res = await fetch(`${env("SUPABASE_URL").replace(/\/$/, "")}/rest/v1/rpc/track_visit`, {
    method: "POST",
    headers: { apikey: key, authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ p_visitor: id, p_new: isNew }),
  });
  if (!res.ok) {
    console.error(`[visitors] ${res.status}: ${await res.text()}`);
    throw new HttpError(502, "db_error", "Counter unavailable.");
  }
  const data = (await res.json()) as { total: number; live: number };
  return json({ total: Number(data.total) || 0, live: Number(data.live) || 1 });
});
