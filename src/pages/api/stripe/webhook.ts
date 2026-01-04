import { buffer } from "micro"
import Stripe from "stripe"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20", // ✅ version supportée
})

export const config = {
  api: { bodyParser: false },
}

export default async function handler(req: any, res: any) {
  const buf = await buffer(req)
  const sig = req.headers["stripe-signature"]
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session
    const { partnerCode, packageId } = session.metadata || {}

    await supabaseAdmin.from("orders").insert({
      stripe_payment_intent_id: session.payment_intent as string,
      partner_code: partnerCode,
      email: session.customer_details?.email,
      total_amount: (session.amount_total || 0) / 100,
      status: "paid",
    })

    // TODO:
    // 1. Appel Airalo
    // 2. Envoi email
  }

  res.json({ received: true })
}
