import type { LatLng } from "./types.js";

/** Decodes an encoded polyline (Google/Ola format). */
export function decodePolyline(encoded: string, precision = 5): LatLng[] {
  const factor = 10 ** precision;
  const out: LatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  const next = () => {
    let result = 0;
    let shift = 0;
    let b: number;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20); // NaN past the end of the string also stops the loop
    return result & 1 ? ~(result >> 1) : result >> 1;
  };
  while (index < encoded.length) {
    lat += next();
    lng += next();
    out.push({ lat: lat / factor, lng: lng / factor });
  }
  return out;
}

/**
 * Decodes a route polyline, picking precision 5 or 6 by checking which one starts near the
 * known origin (providers differ; Ola uses 5 today, but this keeps the map right if that changes).
 */
export function decodeRoutePolyline(encoded: string, origin?: LatLng): LatLng[] {
  const p5 = decodePolyline(encoded, 5);
  if (!origin || !p5.length) return p5;
  const near = (p: LatLng) => Math.abs(p.lat - origin.lat) < 0.5 && Math.abs(p.lng - origin.lng) < 0.5;
  if (near(p5[0])) return p5;
  const p6 = decodePolyline(encoded, 6);
  return p6.length && near(p6[0]) ? p6 : p5;
}

export function encodePolyline(points: LatLng[], precision = 5): string {
  const factor = 10 ** precision;
  let out = "";
  let pLat = 0;
  let pLng = 0;
  const enc = (v: number) => {
    v = v < 0 ? ~(v << 1) : v << 1;
    let s = "";
    while (v >= 0x20) {
      s += String.fromCharCode((0x20 | (v & 0x1f)) + 63);
      v >>= 5;
    }
    return s + String.fromCharCode(v + 63);
  };
  for (const p of points) {
    const lat = Math.round(p.lat * factor);
    const lng = Math.round(p.lng * factor);
    out += enc(lat - pLat) + enc(lng - pLng);
    pLat = lat;
    pLng = lng;
  }
  return out;
}
