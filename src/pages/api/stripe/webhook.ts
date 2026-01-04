import { buffer } from "micro"
import Stripe from "stripe"
import { supabaseAdmin } from "@/lib/supabaseAdmin" // SERVICE_ROLE_KEY

export const config = { api: { bodyParser: false } }

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
})

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" })

  const sig = req.headers["stripe-signature"]
  if (!sig) return res.status(400).send("Missing stripe-signature")

  let event: Stripe.Event

  try {
    const buf = await buffer(req)
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session

      const paymentIntentId =
        typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id

      // On préfère payment_intent_data.metadata (fiable) mais checkout.session.completed donne aussi session.metadata
      const partner_code_raw = session.metadata?.partner_code?.trim()
      const partner_code = partner_code_raw ? partner_code_raw : null

      if (!paymentIntentId) {
        return res.status(400).json({ error: "Missing payment_intent on session" })
      }

      // 1) Anti-doublon
      const { data: existing, error: existingErr } = await supabaseAdmin
        .from("orders")
        .select("id")
        .eq("stripe_payment_intent_id", paymentIntentId)
        .maybeSingle()

      if (existingErr) throw existingErr
      if (existing) return res.status(200).json({ status: "already_processed" })

      // 2) Insertion commande
      const payload = {
        stripe_payment_intent_id: paymentIntentId,
        partner_code: partner_code, // null si absent
        customer_email: session.customer_details?.email ?? session.customer_email ?? null,
        total_amount: ((session.amount_total ?? 0) / 100),
        currency: (session.currency?.toUpperCase() || "EUR"),
        status: "paid",
        created_at: new Date().toISOString(),
      }

      const { error: insertErr } = await supabaseAdmin.from("orders").insert(payload)
      if (insertErr) throw insertErr

      return res.status(200).json({ received: true })
    }

    return res.status(200).json({ received: true })
  } catch (error: any) {
    console.error("Webhook processing error:", error)
    // Stripe retente sur 500 -> OK, anti-doublon protège
    return res.status(500).json({ error: error?.message ?? "Server error" })
  }
}
