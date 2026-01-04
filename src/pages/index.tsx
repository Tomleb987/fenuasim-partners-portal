import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/router"
import { LogOut, TrendingUp, Tag, Calendar, User, ShoppingBag } from "lucide-react"
import { supabaseBrowser } from "@/lib/supabase/browser"

export default function PartnerDashboard() {
  const supabase = useMemo(() => supabaseBrowser(), [])
  const router = useRouter()

  const [sales, setSales] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const fetchStats = async () => {
      setLoading(true)

      // 1) Vérification de la session via cookies
      const { data: sessionData } = await supabase.auth.getSession()
      const user = sessionData.session?.user

      if (!user) {
        window.location.href = "/login"
        return
      }

      // 2) Récupération du profil partenaire
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

    // Déconnexion auto si la session disparaît
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

  // Cas : utilisateur connecté mais pas de profil partenaire
  if (!profile) {
    return (
      <div className="min-h-screen bg-[#fafafa] font-sans">
        <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 px-8 py-6 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="relative h-16 w-40">
              <Image src="/logo-1.png" alt="Fenuasim Logo" fill className="object-contain" priority />
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
              Nous ne trouvons pas votre fiche dans{" "}
              <span className="font-mono text-purple-600">partner_profiles</span>.  
              Contactez l’équipe FENUA SIM pour finaliser l’activation.
            </p>
            <button
              onClick={handleSignOut}
              className="mt-6 rounded-xl px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-orange-500 via-fuchsia-500 to-violet-600 hover:brightness-110 transition"
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
            <Image src="/logo-1.png" alt="Fenuasim Logo" fill className="object-contain" priority />
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
        {/* BIENVENUE */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <header>
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

          <button
            onClick={() => router.push("/shop")}
            className="group flex items-center gap-3 bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-orange-100 transition-all active:scale-95"
          >
            <ShoppingBag className="w-5 h-5 group-hover:animate-bounce" />
            MA BOUTIQUE
          </button>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-gradient-to-br from-purple-600 to-purple-800 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-purple-200 relative overflow-hidden">
            <TrendingUp className="absolute right-[-10px] bottom-[-10px] w-32 h-32 opacity-10" />
            <p className="text-purple-200 font-bold uppercase tracking-widest text-xs mb-2">
              Ventes réalisées
            </p>
            <p className="text-6xl font-black">{sales.length}</p>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-100 relative overflow-hidden">
            <Tag className="absolute right-[-10px] bottom-[-10px] w-32 h-32 text-orange-50 opacity-50" />
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-2">
              Votre Code Partenaire
            </p>
            <p className="text-6xl font-black text-orange-500">
              {profile?.partner_code || "---"}
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
