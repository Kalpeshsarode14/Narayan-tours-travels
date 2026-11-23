import { business, vehicles } from '../config/site.js';

export const inr = (n) =>
  '₹' + Math.round(n).toLocaleString('en-IN');

export const vehicleById = (id) => vehicles.find((v) => v.id === id);

/** Estimated Fare = total km × rate. Round trip counts the distance twice. */
export function estimateFare({ vehicleId, km, tripType }) {
  const v = vehicleById(vehicleId);
  const distance = Number(km);
  if (!v || !Number.isFinite(distance) || distance <= 0) return null;
  const totalKm = tripType === 'round' ? distance * 2 : distance;
  return { vehicle: v, totalKm, rate: v.ratePerKm, fare: totalKm * v.ratePerKm };
}

/** wa.me link with a pre-filled message to the business number. */
export function whatsappLink(message = '') {
  const base = `https://wa.me/${business.whatsappNumber}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export const telLink = `tel:${business.phoneTel}`;

/** Opens WhatsApp in a new tab. Returns false if the browser blocked it. */
export function openWhatsApp(message) {
  try {
    // No 'noopener' feature here: with it, window.open always returns null.
    const w = window.open(whatsappLink(message), '_blank');
    if (w) w.opener = null;
    return !!w;
  } catch {
    return false;
  }
}

export const formatDate = (iso) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const formatTime = (t) => {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ap = h >= 12 ? 'PM' : 'AM';
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${ap}`;
};

export const todayISO = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

/** Indian mobile: 10 digits starting 6–9, optional +91 / 0 prefix. */
export function cleanMobile(raw) {
  const digits = String(raw).replace(/\D/g, '');
  const ten = digits.length === 12 && digits.startsWith('91') ? digits.slice(2)
    : digits.length === 11 && digits.startsWith('0') ? digits.slice(1) : digits;
  return /^[6-9]\d{9}$/.test(ten) ? ten : null;
}
