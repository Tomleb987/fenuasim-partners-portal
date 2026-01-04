import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-04-30.basil" });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createPagesServerClient({ req, res });
  
  // 1. Récupérer l'utilisateur connecté sur le serveur
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return res.status(401).json({ error: "Non autorisé" });

  // 2. Forcer le code partenaire depuis le profil DB (Sécurité maximale)
  const { data: profile } = await supabase
    .from('partner_profiles')
    .select('partner_code')
    .eq('id', session.user.id)
    .single();

  if (!profile?.partner_code) return res.status(400).json({ error: "Code partenaire introuvable" });

  try {
    const { cartItems, customer_email } = req.body;

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: cartItems.map((item: any) => ({
        price_data: {
          currency: 'eur',
          product_data: { name: item.name },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: 1,
      })),
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/shop`,
      customer_email: customer_email,
      metadata: {
        // Injection forcée des métadonnées pour le webhook
        partner_code: profile.partner_code,
        channel: "partner_portal",
        partner_user_id: session.user.id,
        cartItems: JSON.stringify(cartItems)
      },
    });

    res.status(200).json({ sessionId: checkoutSession.id });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}
