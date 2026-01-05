const AIRALO_API_URL = process.env.AIRALO_API_URL;

let cachedToken: string | null = null;
let tokenExpiry: number | null = null;

export async function getAiraloToken() {
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedToken;
  }
  const res = await fetch(`${AIRALO_API_URL}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.AIRALO_CLIENT_ID,
      client_secret: process.env.AIRALO_CLIENT_SECRET,
      grant_type: "client_credentials",
    }),
  });
  
  const responseData = await res.json();
  if (!responseData.data?.access_token) throw new Error("Impossible d'obtenir le token Airalo");
  
  cachedToken = responseData.data.access_token;
  tokenExpiry = Date.now() + (responseData.data.expires_in - 60) * 1000; 
  return cachedToken;
}

export async function createAiraloOrder(airaloPackageId: string, email: string) {
  const token = await getAiraloToken();
  const res = await fetch(`${AIRALO_API_URL}/orders`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      package_id: airaloPackageId,
      quantity: 1,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error("Erreur Airalo: " + errorText);
  }
  
  const orderData = await res.json();
  return {
    id: orderData.data.id,
    sim_iccid: orderData.data.sims?.[0]?.iccid,
    qr_code: orderData.data.sims?.[0]?.qrcode_url
  };
}
