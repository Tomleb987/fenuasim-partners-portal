export interface AiraloOrder {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  order_id: string;
  package_id: string;
  sim_iccid: string;
  qr_code_url: string;
  apple_installation_url: string;
  data_balance: string;
  status: string;
  created_at: string;
  activated_at: string | null;
  expires_at: string | null;
  transaction_type: string | null;
}