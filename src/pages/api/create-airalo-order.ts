import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseServerFromApi } from "@/lib/supabase/server";

function setCors(res: NextApiResponse) {
  // Si ton front appelle depuis le même domaine, tu peux enlever CORS.
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  setCors(res);

  // Preflight CORS
  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // 1) Auth obligatoire (session via cookies)
    const supabase = supabaseServerFromApi(req, res);
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      return res.status(401).json({ error: "Invalid session" });
    }
    if (!session) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // 2) Lecture + validation minimale des inputs
    const {
      packageId,
      customerEmail,
      airalo_id,
      customerName,
      customerFirstname,
      quantity,
      description,
    } = req.body ?? {};

    if (!customerEmail || !airalo_id) {
      return res
        .status(400)
        .json({ error: "Missing required fields: customerEmail, airalo_id" });
    }

    const AIRALO_API_URL = process.env.AIRALO_API_URL;
    const AIRALO_CLIENT_ID = process.env.AIRALO_CLIENT_ID;
    const AIRALO_CLIENT_SECRET = process.env.AIRALO_CLIENT_SECRET;

    if (!AIRALO_API_URL || !AIRALO_CLIENT_ID || !AIRALO_CLIENT_SECRET) {
      return res.status(500).json({ error: "Airalo env vars are missing on server" });
    }

    // 3) Récupérer le token Airalo
    const tokenResponse = await fetch(`${AIRALO_API_URL}/token`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: AIRALO_CLIENT_ID,
        client_secret: AIRALO_CLIENT_SECRET,
        grant_type: "client_credentials",
      }),
    });

    const tokenText = await tokenResponse.text();
    if (!tokenResponse.ok) {
      throw new Error(`Failed to get Airalo access token: ${tokenText}`);
    }

    const tokenData = JSON.parse(tokenText);
    const accessToken: string | undefined = tokenData?.data?.access_token;

    if (!accessToken) {
      throw new Error("Airalo token response missing access_token");
    }

    // 4) Créer la commande Airalo
    const orderBody = {
      package_id: airalo_id,
      quantity: Number(quantity) > 0 ? Number(quantity) : 1,
      type: "sim",
      brand_settings_name: "",
      description: description ?? "",
    };

    const orderResponse = await fetch(`${AIRALO_API_URL}/orders`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(orderBody),
    });

    const orderText = await orderResponse.text();
    if (!orderResponse.ok) {
      throw new Error(`Airalo API error: ${orderText}`);
    }

    const orderData = JSON.parse(orderText);
    const sim = orderData?.data?.sims?.[0];

    // 5) Enregistrer en base (via client server => session/cookies)
    // IMPORTANT: si ta table a du RLS strict, il faudra une policy qui autorise l'insert
    // ou utiliser un service role pour l'insert.
    const { data: order, error: dbError } = await supabase
      .from("airalo_orders")
      .insert({
        // Recommandé si tu peux ajouter la colonne :
        // created_by: session.user.id,

        order_id: String(orderData?.data?.id ?? ""),
        email: customerEmail,
        package_id: packageId ?? null,

        sim_iccid: sim?.iccid ?? null,
        qr_code_url: sim?.qrcode_url ?? null,
        apple_installation_url: sim?.direct_apple_installation_url ?? null,

        status: orderData?.meta?.message ?? "success",
        data_balance: orderData?.data?.data ?? null,

        created_at: new Date().toISOString(),
        nom: customerName ?? null,
        prenom: customerFirstname ?? null,
      })
      .select()
      .single();

    if (dbError) throw dbError;

    res.setHeader("Content-Type", "application/json");
    return res.status(200).json({ order });
  } catch (error: any) {
    console.error("Erreur API:", error);
    res.setHeader("Content-Type", "application/json");
    return res.status(400).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
