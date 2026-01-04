// src/pages/shop.tsx
import { useEffect, useMemo, useState } from "react"
import Head from "next/head"
import { supabaseBrowser } from "@/lib/supabase-browser"

export default function PartnerShopRedirect() {
  const supabase = useMemo(() => supabaseBrowser(), [])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const go = async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      const user = sessionData.session?.user

      if (!user) {
        window.location.href = "/login"
        return
      }

      const { data: prof, error: profErr } = await supabase
        .from("partner_profiles")
        .select("partner_code")
        .eq("id", user.id)
        .single()

      if (profErr || !prof?.partner_code) {
        if (mounted) setError("Votre code partenaire est introuvable. Contactez l’équipe FENUA SIM.")
        return
      }

      const code = encodeURIComponent(prof.partner_code)
      // ✅ URL de la boutique principale
      const target = `https://fenuasim.com/shop?ref=${code}`

      window.location.href = target
    }

    go()

    return () => {
      mounted = false
    }
  }, [supabase])

  return (
    <>
      <Head>
        <title>Boutique partenaire…</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <main className="min-h-screen flex items-center justify-center bg-neutral-950 px-6">
        <div className="max-w-md w-full bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 text-center">
          {!error ? (
            <>
              <p className="text-white font-semibold">Ouverture de votre boutique…</p>
              <p className="text-neutral-400 text-sm mt-2">
                Votre code partenaire est appliqué automatiquement.
              </p>
              <div className="mt-6 animate-spin rounded-full h-10 w-10 border-b-2 border-violet-500 mx-auto" />
            </>
          ) : (
            <>
              <p className="text-white font-semibold">Impossible d’ouvrir la boutique</p>
              <p className="text-red-300 text-sm mt-2">{error}</p>
              <button
                className="mt-6 rounded-xl px-4 py-2 text-sm font-medium text-white
                           bg-gradient-to-r from-orange-500 via-fuchsia-500 to-violet-600"
                onClick={() => (window.location.href = "/")}
              >
                Retour au dashboard
              </button>
            </>
          )}
        </div>
      </main>
    </>
  )
}
