// Browser-safe public configuration. Only *public* values belong here:
// - The Ola Maps browser key is used only to draw the map; lock it to your website's domains
//   in Krutrim Cloud → Ola Maps → Maps Credentials. Location search and routes use a separate
//   server-only key (OLA_MAPS_API_KEY) through /api.
// - The Supabase anon key cannot read or write any table (RLS); it is only used for admin sign-in.
// Set these in Vercel → Settings → Environment Variables (and .env.local for local dev).

// Optional runtime override (used by tests); normally empty.
const runtimeEnv: Record<string, string | undefined> = (typeof window !== "undefined" && (window as any).__NTT_ENV__) || {};
const viteEnv: Record<string, string | undefined> = (import.meta as any).env || {};

export const PUBLIC_ENV = {
  olaMapsBrowserKey: runtimeEnv.VITE_OLA_MAPS_API_KEY ?? viteEnv.VITE_OLA_MAPS_API_KEY ?? "",
  olaMapsStyle:
    runtimeEnv.VITE_OLA_MAPS_STYLE ||
    viteEnv.VITE_OLA_MAPS_STYLE ||
    "https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json",
  supabaseUrl: runtimeEnv.VITE_SUPABASE_URL ?? viteEnv.VITE_SUPABASE_URL ?? "",
  supabaseAnonKey: runtimeEnv.VITE_SUPABASE_ANON_KEY ?? viteEnv.VITE_SUPABASE_ANON_KEY ?? "",
  apiBase: runtimeEnv.VITE_API_BASE ?? viteEnv.VITE_API_BASE ?? "", // same origin by default (/api/...)
};
