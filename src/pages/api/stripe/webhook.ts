import type { NextApiRequest, NextApiResponse } from "next"
import Stripe from "stripe"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

export const config = { api: { bodyParser: false } }

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
})

async function readRawBody(req: NextApiRequest): Promise<Buffer> {
  const chunks: Buffer[] = []
  return await new Promise((resolve, reject) => {
    req.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)))
    req.on("end", () => resolve(Buffer.concat(chunks)))
    req.on("error", reject)
  })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" })

  const sig = req.headers["stripe-signature"]
  if (!sig) return res.status(400).send("Missing stripe-signature")

  let event: Stripe.Event

  try {
    const buf = await readRawBody(req)
    event = stripe.webhooks.constructEvent(buf, sig as string, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session

      const paymentIntentId =
        typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id

      if (!paymentIntentId) {
        return res.status(400).json({ error: "Missing payment_intent on session" })
      }

      const partner_code = session.metadata?.partner_code?.trim() || null

      // Anti-doublon
      const { data: existing, error: existingErr } = await supabaseAdmin
        .from("orders")
        .select("id")
        .eq("stripe_payment_intent_id", paymentIntentId)
        .maybeSingle()

      if (existingErr) throw existingErr
      if (existing) return res.status(200).json({ status: "already_processed" })

      // ⚠️ Ajuste le nom de la colonne email si besoin (email vs customer_email)
      const payload = {
        stripe_payment_intent_id: paymentIntentId,
        partner_code,
        customer_email: session.customer_details?.email ?? session.customer_email ?? null,
        total_amount: (session.amount_total ?? 0) / 100,
        currency: (session.currency?.toUpperCase() || "EUR"),
        status: "paid",
        created_at: new Date().toISOString(),
      }

      const { error: insertErr } = await supabaseAdmin.from("orders").insert(payload)
      if (insertErr) throw insertErr
    }

    return res.status(200).json({ received: true })
  } catch (err: any) {
    console.error("Webhook processing error:", err)
    return res.status(500).json({ error: err?.message ?? "Server error" })
  }
}
