import { buffer } from "micro";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin"; // Utilise le SERVICE_ROLE_KEY

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-04-30.basil" });

export const config = { api: { bodyParser: false } };

export default async function handler(req: any, res: any) {
  const buf = await buffer(req);
  const sig = req.headers["stripe-signature"];
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const { partner_code } = session.metadata || {};

    try {
      // 1. Anti-doublon : Vérifier si l'ID de paiement existe déjà
      const { data: existing } = await supabaseAdmin
        .from('orders')
        .select('id')
        .eq('stripe_payment_intent_id', session.payment_intent as string)
        .maybeSingle();

      if (existing) return res.status(200).json({ status: "already_processed" });

      // 2. Insertion de la commande avec attribution partenaire
      const { error } = await supabaseAdmin
        .from("orders")
        .insert({
          stripe_payment_intent_id: session.payment_intent as string,
          partner_code: partner_code,
          email: session.customer_details?.email,
          total_amount: (session.amount_total ?? 0) / 100,
          currency: session.currency?.toUpperCase() || "EUR",
          status: "paid",
          created_at: new Date().toISOString()
          // Ajoutez ici la logique airalo_order_id si vous déclenchez la commande eSIM immédiatement
        });

      if (error) throw error;
      return res.status(200).json({ received: true });
    } catch (error: any) {
      console.error("Erreur insertion commande:", error);
      return res.status(500).json({ error: error.message });
    }
  }
  res.status(200).json({ received: true });
}
