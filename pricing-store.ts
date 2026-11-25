import { DEFAULT_PRICING } from "../booking/default-pricing.js";
import type { PricingConfig } from "../booking/types.js";
import { validatePricingConfig } from "../booking/validation.js";
import { db } from "./supabase.js";

export interface SiteSettings {
  business_name: string;
  whatsapp_number: string;
  contact_phone: string;
  contact_email: string;
}

/** Newest saved pricing, or the built-in defaults if the admin has not saved any yet. */
export async function getActivePricing(): Promise<PricingConfig> {
  const rows = await db.select<{ id: number; config: unknown }>("pricing_versions", {
    select: "id,config",
    order: "id.desc",
    limit: "1",
  });
  if (!rows[0]) return { ...DEFAULT_PRICING, version: undefined };
  // Re-validate on read, so a hand-edited row can never break pricing.
  const cfg = validatePricingConfig(rows[0].config);
  return { ...cfg, version: rows[0].id };
}

export async function savePricing(config: PricingConfig, userId: string): Promise<PricingConfig> {
  const clean = validatePricingConfig(config);
  const [row] = await db.insert<{ id: number }>("pricing_versions", { config: clean, created_by: userId });
  return { ...clean, version: row.id };
}

export async function getSettings(): Promise<SiteSettings> {
  const rows = await db.select<SiteSettings>("site_settings", {
    select: "business_name,whatsapp_number,contact_phone,contact_email",
    id: "eq.1",
  });
  return (
    rows[0] || {
      business_name: "Narayan Tours & Travels",
      whatsapp_number: "919967456323",
      contact_phone: "+91 99674 56323",
      contact_email: "",
    }
  );
}

/** Public subset of pricing for the booking form (vehicles, packages, extras, enabled trip types). */
export function publicPricing(cfg: PricingConfig): PricingConfig {
  return { ...cfg, vehicles: cfg.vehicles.filter((v) => v.enabled) };
}
