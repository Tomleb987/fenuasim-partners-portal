import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/router"
import { supabaseBrowser } from "@/lib/supabase/browser"

export default function Shop() {
  const supabase = useMemo(() => supabaseBrowser(), [])
  const router = useRouter()

  const [partner, setPartner] = useState<any>(null)
  const [packages, setPackages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const init = async () => {
      setLoading(true)

      const {
        data: { session },
      } = await supabase.auth.getSession()

      // ✅ GARDE OBLIGATOIRE
      if (!session) {
        router.replace("/login")
        return
      }

      // 1) Profil partenaire
      const { data: prof, error: profErr } = await supabase
        .from("partner_profiles")
        .select("*")
        .eq("id", session.user.id)
        .single()

      if (!mounted) return

      if (profErr || !prof) {
        setPartner(null)
        setPackages([])
        setLoading(false)
        return
      }

      setPartner(prof)

      // 2) Packages Airalo
      const { data: pkg } = await supabase
        .from("airalo_packages")
        .select("*")
        .limit(20)

      if (!mounted) return

      setPackages(pkg || [])
      setLoading(false)
    }

    init()

    return () => {
      mounted = false
    }
  }, [supabase, router])

  if (loading) {
    return <div className="p-10 text-center">Chargement…</div>
  }

  if (!partner) {
    return (
      <div className="p-10 text-center text-gray-500">
        Aucun profil partenaire trouvé.
      </div>
    )
  }

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold mb-6">
        Boutique partenaire — {partner.partner_code}
      </h1>

      <ul className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {packages.map((p) => (
          <li
            key={p.id}
            className="border rounded-xl p-6 hover:shadow-lg transition"
          >
            <h2 className="font-bold">{p.name}</h2>
            <p className="text-sm text-gray-500">{p.description}</p>
            <p className="mt-4 font-black text-lg">{p.price} €</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
