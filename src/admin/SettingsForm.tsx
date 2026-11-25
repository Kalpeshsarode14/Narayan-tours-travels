import { useEffect, useState } from "react";
import type { AdminFetch } from "./AdminApp";

interface Settings {
  business_name: string;
  whatsapp_number: string;
  contact_phone: string;
  contact_email: string;
}

export default function SettingsForm({ api }: { api: AdminFetch }) {
  const [s, setS] = useState<Settings | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<{ settings: Settings }>("/api/admin/settings")
      .then((r) => setS(r.settings))
      .catch((e) => setMsg({ ok: false, text: e.message }));
  }, []);

  if (!s) return <p>{msg?.text || "Loading…"}</p>;
  const field = (k: keyof Settings, label: string, hint?: string, type = "text") => (
    <div className="ntt-field">
      <label htmlFor={`s-${k}`}>{label}</label>
      <input id={`s-${k}`} type={type} value={s[k]} onChange={(e) => setS({ ...s, [k]: e.target.value })} />
      {hint && <p className="ntt-hint">{hint}</p>}
    </div>
  );

  return (
    <form
      className="ntt-card ntt-adm-settings"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setMsg(null);
        try {
          const r = await api<{ settings: Settings }>("/api/admin/settings", { method: "PUT", body: JSON.stringify(s) });
          setS(r.settings);
          setMsg({ ok: true, text: "Saved." });
        } catch (err: any) {
          setMsg({ ok: false, text: err.message });
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2>Business settings</h2>
      {field("business_name", "Business name", "Shown in the WhatsApp confirmation message.")}
      {field("whatsapp_number", "WhatsApp number for bookings", "With country code, digits only, e.g. 919967456323.", "tel")}
      {field("contact_phone", "Phone number shown to customers", undefined, "tel")}
      {field("contact_email", "Contact email (optional)", undefined, "email")}
      {msg && <p className={msg.ok ? "ntt-ok" : "ntt-error"}>{msg.text}</p>}
      <button className="ntt-btn ntt-btn-primary" disabled={busy}>
        {busy ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
