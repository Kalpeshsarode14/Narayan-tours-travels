// Browser-safe public configuration. Only *public* values belong here:
// - The Google browser key is restricted to your website's domains (HTTP referrer) in Google Cloud.
// - The Supabase anon key cannot read or write any table (RLS); it is only used for admin sign-in.
// Set these in Vercel → Settings → Environment Variables (and .env.local for local dev).

// Optional runtime override (used by tests); normally empty.
const runtimeEnv: Record<string, string | undefined> = (typeof window !== "undefined" && (window as any).__NTT_ENV__) || {};
const viteEnv: Record<string, string | undefined> = (import.meta as any).env || {};

export const PUBLIC_ENV = {
  googleMapsBrowserKey: runtimeEnv.VITE_GOOGLE_MAPS_BROWSER_KEY ?? viteEnv.VITE_GOOGLE_MAPS_BROWSER_KEY ?? "",
  googleMapsMapId: runtimeEnv.VITE_GOOGLE_MAPS_MAP_ID || viteEnv.VITE_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID",
  supabaseUrl: runtimeEnv.VITE_SUPABASE_URL ?? viteEnv.VITE_SUPABASE_URL ?? "",
  supabaseAnonKey: runtimeEnv.VITE_SUPABASE_ANON_KEY ?? viteEnv.VITE_SUPABASE_ANON_KEY ?? "",
  apiBase: runtimeEnv.VITE_API_BASE ?? viteEnv.VITE_API_BASE ?? "", // same origin by default (/api/...)
};
