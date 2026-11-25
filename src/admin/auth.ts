// Supabase Auth over REST (no extra dependency). Session lives in sessionStorage, so it is cleared when the tab closes.
import { PUBLIC_ENV } from "../booking/env";

export interface Session {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // ms
  email: string;
}

const KEY = "ntt_admin_session";

function authUrl(path: string) {
  if (!PUBLIC_ENV.supabaseUrl || !PUBLIC_ENV.supabaseAnonKey) {
    throw new Error("Admin sign-in is not configured (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).");
  }
  return `${PUBLIC_ENV.supabaseUrl.replace(/\/$/, "")}/auth/v1/${path}`;
}

async function tokenRequest(grant: "password" | "refresh_token", body: object): Promise<Session> {
  const res = await fetch(authUrl(`token?grant_type=${grant}`), {
    method: "POST",
    headers: { apikey: PUBLIC_ENV.supabaseAnonKey, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error_description || data.msg || "Sign-in failed. Check your email and password.");
  const s: Session = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
    email: data.user?.email || "",
  };
  sessionStorage.setItem(KEY, JSON.stringify(s));
  return s;
}

export const signIn = (email: string, password: string) => tokenRequest("password", { email, password });

export function loadSession(): Session | null {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || "null");
  } catch {
    return null;
  }
}

/** Returns a valid access token, refreshing it if it expires within 2 minutes. */
export async function freshToken(s: Session): Promise<Session> {
  if (s.expiresAt - Date.now() > 120_000) return s;
  return tokenRequest("refresh_token", { refresh_token: s.refreshToken });
}

export async function signOut(s: Session | null) {
  sessionStorage.removeItem(KEY);
  if (!s) return;
  try {
    await fetch(authUrl("logout"), {
      method: "POST",
      headers: { apikey: PUBLIC_ENV.supabaseAnonKey, authorization: `Bearer ${s.accessToken}` },
    });
  } catch {
    /* ignore */
  }
}
