import type { NextApiRequest, NextApiResponse } from "next"
import Stripe from "stripe"
import { createServerClient, type CookieOptions } from "@supabase/ssr"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
})

type CartItem = { name: string; price: number; quantity?: number }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" })

  // Supabase server client basé sur cookies (cohérent avec ton middleware)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies[name]
        },
        set(name: string, value: string, options: CookieOptions) {
          // API routes: on set le cookie sur la réponse
          res.setHeader("Set-Cookie", `${name}=${value}; Path=/; HttpOnly; SameSite=Lax`)
        },
        remove(name: string, options: CookieOptions) {
          res.setHeader("Set-Cookie", `${name}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`)
        },
      },
    }
  )

  const { data: { user }, error: userErr } = await supabase.auth.getUser()
  if (userErr) return res.status(500).json({ error: userErr.message })
  if (!user) return res.status(401).json({ error: "Non autorisé" })

  // Forcer partner_code depuis DB
  const { data: profile, error: profErr } = await supabase
    .from("partner_profiles")
    .select("partner_code")
    .eq("id", user.id)
    .single()

  if (profErr) return res.status(500).json({ error: profErr.message })
  if (!profile?.partner_code) return res.status(400).json({ error: "Code partenaire introuvable" })

  try {
    const { cartItems, customer_email } = (req.body ?? {}) as {
      cartItems?: CartItem[]
      customer_email?: string
    }

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ error: "Panier vide ou invalide" })
    }

    if (!process.env.NEXT_PUBLIC_BASE_URL) {
      return res.status(500).json({ error: "NEXT_PUBLIC_BASE_URL manquant" })
    }

    const cartCompact = cartItems.map((i) => ({
      name: String(i.name ?? "").slice(0, 80),
      price: Number(i.price ?? 0),
      qty: Number(i.quantity ?? 1),
    }))

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: customer_email || undefined,

      line_items: cartItems.map((item) => ({
        price_data: {
          currency: "eur",
          product_data: { name: String(item.name ?? "Produit") },
          unit_amount: Math.round(Number(item.price) * 100),
        },
        quantity: Number(item.quantity ?? 1),
      })),

      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/shop`,

      payment_intent_data: {
        metadata: {
          partner_code: profile.partner_code,
          channel: "partner_portal",
          partner_user_id: user.id,
          cart: JSON.stringify(cartCompact),
        },
      },

      metadata: {
        partner_code: profile.partner_code,
        channel: "partner_portal",
        partner_user_id: user.id,
      },
    })

    return res.status(200).json({ sessionId: checkoutSession.id, url: checkoutSession.url })
  } catch (error: any) {
    return res.status(500).json({ error: error?.message ?? "Erreur serveur" })
  }
}
