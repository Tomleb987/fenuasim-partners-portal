import { Json } from "@/lib/supabase/config";

export interface AiraloPackage {
  id: string; // Supabase table primary key (usually a number or UUID, ensure this matches your table)
  airalo_id?: string; // Actual Airalo package ID, if different from your DB's id
  name: string;
  slug: string;
  day?:string;
  description?: string;
  country?: string; // ISO 3166-1 alpha-2 country code, e.g., 'FR', 'US'
  region: string; // e.g., 'Paris', 'New York'
  type: string; // 'global', 'local'
  data_amount: number; // e.g., 1, 5, 10 - ensure type matches your data source
  data_unit: string; // e.g., 'GB', 'MB'
  validity?: number; // e.g., 7, 30, 365
  includes_voice?: boolean;
  includes_sms?: boolean;
  available_topup?: boolean;
  final_price_eur: number;
  final_price_usd: number;
  final_price_xpf: number;
  price_usd?: number;
  price_eur?: number; // Original price before any discounts, if applicable
  price_xpf?: number;
  recommended_retail_price: Json;
  operator_name?: string;
  operator_logo_url?: string;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string | null;
  price: number; // Price in the default currency
  region_fr: string; // French name of the region
  currency?: string; // Default currency, e.g., 'EUR', 'USD'
  title?: string;
  shortInfo?: string;
}