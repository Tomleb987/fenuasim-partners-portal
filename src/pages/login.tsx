// src/pages/login.tsx
import { useEffect, useState } from "react"
import Head from "next/head"
import { useRouter } from "next/router"
import { supabaseBrowser } from "@/lib/supabase-browser"

export default function LoginPage() {
  const router = useRouter()
  const supabase = supabaseBrowser()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Si déjà connecté, on sort de /login
  useEffect(() => {
    let mounted = true
    ;(async () => {
      const { data } = await supabase.auth.getSession()
      if (!mounted) return
      if (data.session) {
        // hard redirect pour être cohérent avec le middleware
        window.location.href = "/"
      }
    })()
    return () => {
      mounted = false
    }
  }, [supabase])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg(null)
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) {
        setErrorMsg(error.message)
        return
      }

      // IMPORTANT : hard navigation pour que le middleware relise les cookies
      window.location.href = "/"
    } catch (err: any) {
      setErrorMsg(err?.message ?? "Erreur inconnue.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Partenaires — Connexion</title>
        <meta name="robots" content="noindex,nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="min-h-screen flex items-center justify-center bg-neutral-950 px-4">
        <div className="w-full max-w-md rounded-2xl bg-neutral-900/60 border border-neutral-800 p-6 shadow-xl">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-white">Espace Partenaires</h1>
            <p className="text-sm text-neutral-300 mt-1">
              Connectez-vous pour accéder à votre tableau de bord.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {errorMsg}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-neutral-200 mb-1">Email</label>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl bg-neutral-950 border border-neutral-800 px-3 py-2 text-white outline-none focus:border-neutral-600"
                placeholder="nom@domaine.com"
              />
            </div>

            <div>
              <label className="block text-sm text-neutral-200 mb-1">Mot de passe</label>
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl bg-neutral-950 border border-neutral-800 px-3 py-2 text-white outline-none focus:border-neutral-600"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl px-4 py-2 text-sm font-medium text-white disabled:opacity-60
                         bg-gradient-to-r from-orange-500 via-fuchsia-500 to-violet-600
                         hover:brightness-110 transition"
            >
              {loading ? "Connexion…" : "Se connecter"}
            </button>

            <div className="text-xs text-neutral-400 pt-2">
              Problème d’accès ? Contactez le support FENUA SIM.
            </div>
          </form>
        </div>
      </main>
    </>
  )
}
