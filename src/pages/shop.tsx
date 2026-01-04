// src/pages/shop.tsx
import { useEffect, useMemo, useState } from "react"
import Head from "next/head"
import Image from "next/image"
import { useRouter } from "next/router"
import { supabaseBrowser } from "@/lib/supabase-browser"

type Product = {
  id: string
  country?: string | null
  country_name?: string | null
  title?: string | null
  name?: string | null
  data_gb?: number | null
  duration_days?: number | null
  price_eur?: number | null
  price?: number | null
  currency?: string | null
}

export default function PartnerShopPage() {
  const supabase = useMemo(() => supabaseBrowser(), [])
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [payingId, setPayingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [partnerCode, setPartnerCode] = useState<string | null>(null)
  const [advisorName, setAdvisorName] = useState<string | null>(null)

  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    let mounted = true

    const init = async () => {
      setLoading(true)
      setError(null)

      const { data: sessionData } = await supabase.auth.getSession()
      const user = sessionData.session?.user
      if (!user) {
        window.location.href = "/login"
        return
      }

      // Profil partenaire (code + nom)
      const { data: prof, error: profErr } = await supabase
        .from("partner_profiles")
        .select("partner_code, advisor_name")
        .eq("id", user.id)
        .single()

      if (profErr || !prof?.partner_code) {
        if (mounted) {
          setPartnerCode(null)
          setAdvisorName(null)
          setProducts([])
          setError("Votre code partenaire est introuvable. Contactez l’équipe FENUA SIM.")
          setLoading(false)
        }
        return
      }

      if (!mounted) return
      setPartnerCode(prof.partner_code)
      setAdvisorName(prof.advisor_name ?? null)

      // ✅ Produits : par défaut on lit airalo_packages (adapte si ton schéma diffère)
      // Champs attendus : id, country_name/title/name, data_gb, duration_days, price_eur (ou price)
      const { data: packs, error: packsErr } = await supabase
        .from("airalo_packages")
        .select("id, country_name, title, name, data_gb, duration_days, price_eur, price, currency")
        .order("price_eur", { ascending: true })

      if (packsErr) {
        if (mounted) {
          setProducts([])
          setError("Impossible de charger les offres. Réessayez dans quelques instants.")
          setLoading(false)
        }
        return
      }

      if (!mounted) return
      setProducts((packs as Product[]) || [])
      setLoading(false)
    }

    init()

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (!session) window.location.href = "/login"
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [supabase])

  const signOut = async () => {
    await supabase.auth.signOut()
    window.location.href = "/login"
  }

  const startCheckout = async (product: Product) => {
    setError(null)
    setPayingId(product.id)

    try {
      const price =
        typeof product.price_eur === "number"
          ? product.price_eur
          : typeof product.price === "number"
            ? product.price
            : null

      if (!price) throw new Error("Prix produit introuvable.")

      const name =
        product.title ||
        product.name ||
        product.country_name ||
        "Forfait eSIM"

      // Panier minimal (un item) — le partner_code est FORCÉ côté serveur
      const cartItems = [
        {
          name,
          price,
          quantity: 1,
          product_id: product.id,
        },
      ]

      const r = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartItems,
          customer_email: null,
        }),
      })

      const json = await r.json()
      if (!r.ok) throw new Error(json?.error || "Erreur création paiement.")

      // Stripe Checkout : on redirige vers l’URL si fournie, sinon on navigue via sessionId
      if (json?.url) {
        window.location.href = json.url
        return
      }

      // fallback (si tu ne renvoies que sessionId)
      if (json?.sessionId) {
        // Si tu utilises stripe-js côté client, tu peux rediriger via redirectToCheckout.
        // Ici on reste simple : on laisse l’API renvoyer url idéalement.
        throw new Error("URL Stripe manquante. Ajustez l’API pour renvoyer checkoutSession.url.")
      }

      throw new Error("Réponse paiement invalide.")
    } catch (e: any) {
      setError(e?.message ?? "Erreur inconnue.")
      setPayingId(null)
    }
  }

  return (
    <>
      <Head>
        <title>Boutique Partenaire — FENUA SIM</title>
        <meta name="robots" content="noindex,nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-[#fafafa] font-sans">
        {/* HEADER */}
        <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 px-8 py-6 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-6">
              <div className="relative h-12 w-32">
                <Image
                  src="/logo-1.png"
                  alt="Fenuasim Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>

              {partnerCode && (
                <div className="hidden sm:flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Code Partenaire
                  </span>
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest
                                   bg-orange-100 text-orange-600">
                    {partnerCode}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/")}
                className="rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest
                           text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition"
              >
                Dashboard
              </button>
              <button
                onClick={signOut}
                className="rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest
                           text-white bg-gradient-to-r from-orange-500 via-fuchsia-500 to-violet-600
                           hover:brightness-110 transition"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-6 py-12">
          <header className="mb-10">
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">
              Boutique Partenaire
              {advisorName ? (
                <>
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-orange-500">
                    {advisorName}
                  </span>
                </>
              ) : null}
            </h1>
            <p className="text-gray-500 mt-3 max-w-2xl">
              Les ventes réalisées ici sont automatiquement attribuées à votre code partenaire.
            </p>
          </header>

          {error && (
            <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="min-h-[50vh] flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
            </div>
          ) : (
            <>
              {products.length === 0 ? (
                <div className="rounded-3xl bg-white border border-gray-100 shadow-sm p-10 text-center text-gray-500">
                  Aucune offre disponible pour le moment.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {products.map((p) => {
                    const price =
                      typeof p.price_eur === "number"
                        ? p.price_eur
                        : typeof p.price === "number"
                          ? p.price
                          : null

                    const title =
                      p.title ||
                      p.name ||
                      p.country_name ||
                      "Forfait eSIM"

                    return (
                      <div
                        key={p.id}
                        className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 hover:shadow-md transition"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-gray-900 font-extrabold text-lg">{title}</p>
                            <p className="text-gray-400 text-sm mt-1">
                              {p.data_gb ? `${p.data_gb} Go` : "Data"}{" "}
                              {p.duration_days ? `• ${p.duration_days} jours` : ""}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-gray-900 font-black text-xl">
                              {price !== null ? `${price.toFixed(2)} €` : "—"}
                            </p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                              Paiement sécurisé
                            </p>
                          </div>
                        </div>

                        <button
                          disabled={payingId === p.id || price === null}
                          onClick={() => startCheckout(p)}
                          className="mt-6 w-full rounded-2xl px-5 py-3 text-sm font-black uppercase tracking-widest
                                     text-white disabled:opacity-60
                                     bg-gradient-to-r from-orange-500 via-fuchsia-500 to-violet-600
                                     hover:brightness-110 transition"
                        >
                          {payingId === p.id ? "Redirection…" : "Acheter"}
                        </button>

                        <p className="mt-3 text-xs text-gray-400">
                          Attribution automatique : <span className="font-mono">{partnerCode}</span>
                        </p>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </>
  )
}
