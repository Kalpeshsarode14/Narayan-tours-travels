import { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';

// Footer badge: total visitors + people visiting right now.
// A visit is counted once per browser session; "visiting now" refreshes every 30s.
export default function VisitorCounter({ className = '' }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let id = null;
    let isNew = false;
    try {
      id = sessionStorage.getItem('ntt_vid');
      if (!id) {
        id = (crypto.randomUUID?.() || Math.random().toString(36).slice(2) + Date.now().toString(36)).replace(/-/g, '');
        sessionStorage.setItem('ntt_vid', id);
        isNew = true;
      }
    } catch {
      id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    }

    let alive = true;
    const ping = (countVisit) =>
      fetch('/api/visitors', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id, isNew: countVisit }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => alive && d && typeof d.total === 'number' && setStats(d))
        .catch(() => {});

    ping(isNew);
    const t = setInterval(() => document.visibilityState === 'visible' && ping(false), 30_000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  if (!stats) return null;

  return (
    <p className={`flex flex-wrap items-center gap-x-4 gap-y-1 ${className}`} aria-live="polite">
      <span className="inline-flex items-center gap-1.5">
        <Eye className="h-4 w-4 text-gold-400" aria-hidden="true" />
        <span><strong className="font-semibold text-white">{stats.total.toLocaleString('en-IN')}</strong> visitors</span>
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
          <span className="absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-60 motion-safe:animate-ping" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#25D366]" />
        </span>
        <span><strong className="font-semibold text-white">{stats.live}</strong> visiting now</span>
      </span>
    </p>
  );
}
