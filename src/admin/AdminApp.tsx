import { useCallback, useEffect, useState } from "react";
import { adminCall, ApiError } from "../booking/api";
import { freshToken, loadSession, signIn, signOut, type Session } from "./auth";
import PricingEditor from "./PricingEditor";
import BookingsTable from "./BookingsTable";
import SettingsForm from "./SettingsForm";
import "../booking/booking.css";
import "./admin.css";

type Tab = "pricing" | "bookings" | "settings";

export type AdminFetch = <T>(path: string, init?: RequestInit) => Promise<T>;

/** Admin dashboard at /admin. Every API call is re-checked on the server (valid login AND listed in admin_users). */
export default function AdminApp() {
  const [session, setSession] = useState<Session | null>(() => loadSession());
  const [tab, setTab] = useState<Tab>("pricing");

  useEffect(() => {
    document.title = "Admin · NTT Travel";
    let meta = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "robots";
      document.head.appendChild(meta);
    }
    meta.content = "noindex, nofollow";
  }, []);

  const fetcher: AdminFetch = useCallback(
    async <T,>(path: string, init: RequestInit = {}) => {
      if (!session) throw new ApiError(401, "unauthorized", "Please sign in.", null);
      let s = session;
      try {
        s = await freshToken(session);
        if (s !== session) setSession(s);
      } catch {
        setSession(null);
        throw new ApiError(401, "unauthorized", "Session expired. Please sign in again.", null);
      }
      try {
        return await adminCall<T>(path, s.accessToken, init);
      } catch (e) {
        if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
          await signOut(s);
          setSession(null);
        }
        throw e;
      }
    },
    [session]
  );

  if (!session) return <Login onSignedIn={setSession} />;

  return (
    <div className="ntt-admin">
      <header className="ntt-admin-bar">
        <strong>NTT Admin</strong>
        <nav>
          {(["pricing", "bookings", "settings"] as Tab[]).map((t) => (
            <button key={t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>
              {t === "pricing" ? "Pricing" : t === "bookings" ? "Bookings" : "Business settings"}
            </button>
          ))}
        </nav>
        <span className="ntt-admin-user">
          {session.email}
          <button
            className="ntt-link-btn"
            onClick={async () => {
              await signOut(session);
              setSession(null);
            }}
          >
            Sign out
          </button>
        </span>
      </header>
      <main className="ntt-admin-main">
        {tab === "pricing" && <PricingEditor api={fetcher} />}
        {tab === "bookings" && <BookingsTable api={fetcher} />}
        {tab === "settings" && <SettingsForm api={fetcher} />}
      </main>
    </div>
  );
}

function Login({ onSignedIn }: { onSignedIn: (s: Session) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="ntt-booking ntt-admin-login">
      <form
        className="ntt-card"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            const s = await signIn(email.trim(), password);
            // Confirm admin rights before showing the dashboard
            await adminCall("/api/admin/settings", s.accessToken);
            onSignedIn(s);
          } catch (err: any) {
            await signOut(loadSession());
            setError(err.status === 403 ? "This account does not have admin access." : err.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <h1>Admin sign in</h1>
        <div className="ntt-field">
          <label htmlFor="a-email">Email</label>
          <input id="a-email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="ntt-field">
          <label htmlFor="a-pass">Password</label>
          <input
            id="a-pass"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className="ntt-error">{error}</p>}
        <button className="ntt-btn ntt-btn-primary" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
