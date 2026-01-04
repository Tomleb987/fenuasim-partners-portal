// src/pages/index.tsx
import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { LogOut, TrendingUp, Tag, Calendar, User } from "lucide-react"
import { supabaseBrowser } from "@/lib/supabase-browser"

export default function PartnerDashboard() {
  const supabase = useMemo(() => supabaseBrowser(), [])

  const [sales, setSales] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const fetchStats = async () => {
      setLoading(true)

      // 1) Session (cookies) : cohérent avec middleware
      const { data: sessionData } = await supabase.auth.getSession()
      const user = sessionData.session?.user

      if (!user) {
        window.location.href = "/login"
        return
      }

      // 2) Profil partenaire
      const { data: prof, error: profErr } = await supabase
        .from("partner_profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (profErr || !prof) {
        if (mounted) {
          setProfile(null)
          setSales([])
          setLoading(false)
        }
        return
      }

      if (!mounted) return
      setProfile(prof)

      // 3) Commandes liées au code partenaire
      if (prof?.partner_code) {
        const { data: ord } = await supabase
          .from("orders")
          .select("*")
          .eq("partner_code", prof.partner_code)
          .order("created_at", { ascending: false })

        if (!mounted) return
        setSales(ord || [])
      } else {
        if (!mounted) return
        setSales([])
      }

      if (mounted) setLoading(false)
    }

    fetchStats()

    // Si session change (logout ailleurs), on sort
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) window.location.href = "/login"
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = "/login"
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-purple-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
      </div>
    )
  }

  // Profil introuvable / pas encore activé (RLS, ligne manquante, etc.)
  if (!profile) {
    return (
      <div className="min-h-screen bg-[#fafafa] font-sans">
        <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 px-8 py-6 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="relative h-16 w-40">
              <Image
                src="/logo-1.png"
                alt="Fenuasim Logo"
                fill
                className="object-contain"
                priority
              />
            </div>

            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 text-gray-400 font-bold hover:text-red-500 transition-all uppercase text-xs tracking-widest"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </nav>

        <main className="max-w-xl mx-auto px-6 mt-16">
          <div className="bg-white rounded-[2rem] shadow-xl shadow-gray-100 border border-gray-100 p-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-600 text-[10px] font-black uppercase tracking-widest mb-4">
              <User className="w-3 h-3" /> Accès incomplet
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900">
              Votre profil partenaire n’est pas encore activé
            </h1>
            <p className="text-gray-500 text-sm mt-2">
              Nous ne trouvons pas votre fiche dans <span className="font-mono">partner_profiles</span>.
              Contactez l’équipe FENUA SIM pour finaliser l’activation.
            </p>

            <button
              onClick={handleSignOut}
              className="mt-6 rounded-xl px-4 py-2 text-sm font-medium text-white
                         bg-gradient-to-r from-orange-500 via-fuchsia-500 to-violet-600
                         hover:brightness-110 transition"
            >
              Se déconnecter
            </button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fafafa] font-sans pb-20">
      {/* HEADER */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 px-8 py-6 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="relative h-16 w-40">
            <Image
              src="/logo-1.png"
              alt="Fenuasim Logo"
              fill
              className="object-contain"
              priority
            />
          </div>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-gray-400 font-bold hover:text-red-500 transition-all uppercase text-xs tracking-widest"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Déconnexion</span>
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 mt-16">
        {/* Bienvenue */}
        <header className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-600 text-[10px] font-black uppercase tracking-widest mb-4">
            <User className="w-3 h-3" /> Espace Conseiller
          </div>
          <h2 className="text-4xl font-extrabold text-gray-900 leading-tight">
            Heureux de vous voir, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-orange-500">
              {profile?.advisor_name || "Partenaire"}
            </span>
          </h2>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-gradient-to-br from-purple-600 to-purple-800 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-purple-200 relative overflow-hidden group">
            <TrendingUp className="absolute right-[-10px] bottom-[-10px] w-32 h-32 opacity-10 group-hover:scale-110 transition-transform duration-500" />
            <p className="text-purple-200 font-bold uppercase tracking-widest text-xs mb-2">
              Ventes réalisées
            </p>
            <p className="text-6xl font-black">{sales.length}</p>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-100 relative overflow-hidden group">
            <Tag className="absolute right-[-10px] bottom-[-10px] w-32 h-32 text-orange-50 opacity-50 group-hover:scale-110 transition-transform duration-500" />
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-2">
              Votre Code Partenaire
            </p>
            <p className="text-6xl font-black text-orange-500">
              {profile?.partner_code || "---"}
            </p>
          </div>
        </div>

        {/* Historique */}
        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-100 border border-gray-100 overflow-hidden">
          <div className="p-8 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-purple-600" />
              <h3 className="text-xl font-bold text-gray-900">
                Historique des commandes
              </h3>
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-full">
              Derniers 30 jours
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="p-6 text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em]">
                    Date
                  </th>
                  <th className="p-6 text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em]">
                    Référence
                  </th>
                  <th className="p-6 text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em]">
                    Montant
                  </th>
                  <th className="p-6 text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em] text-right">
                    Statut
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-50">
                {sales.length > 0 ? (
                  sales.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-purple-50/30 transition-colors"
                    >
                      <td className="p-6 text-gray-600 font-medium text-sm">
                        {order.created_at
                          ? new Date(order.created_at).toLocaleDateString("fr-FR")
                          : "-"}
                      </td>
                      <td className="p-6 text-gray-400 font-mono text-xs italic">
                        #{String(order.id).slice(0, 8)}
                      </td>
                      <td className="p-6 text-gray-900 font-black text-lg">
                        {order.total_amount} €
                      </td>
                      <td className="p-6 text-right">
                        <span className="px-4 py-1.5 rounded-full text-[10px] font-black bg-green-100 text-green-700 uppercase tracking-widest">
                          {order.status || "Validé"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-20 text-center text-gray-300 font-medium">
                      Aucune vente enregistrée pour le moment.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
