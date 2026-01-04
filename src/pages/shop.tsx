import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/router"
import { supabaseBrowser } from "@/lib/supabase/browser"

import PackageCard from "@/components/shop/PackageCard";

type AiraloPackage = {
  id: string
  country: string
  region?: string | null
  name: string
  data: string
  validity: string
  final_price_eur: number
}

export default function Shop() {
  const supabase = useMemo(() => supabaseBrowser(), [])
  const router = useRouter()

  const [packages, setPackages] = useState<AiraloPackage[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("airalo_packages")
        .select("*")
        .order("country")

      if (!error && data) {
        setPackages(data as AiraloPackage[])
      }

      setLoading(false)
    }

    load()
  }, [supabase])

  /** 🔍 Filtrage par pays / destination */
  const filteredPackages = useMemo(() => {
    if (!search) return packages

    const q = search.toLowerCase()
    return packages.filter(
      (p) =>
        p.country.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q)
    )
  }, [packages, search])

  /** 🌍 Groupement par pays */
  const packagesByCountry = useMemo(() => {
    return filteredPackages.reduce<Record<string, AiraloPackage[]>>(
      (acc, pkg) => {
        const key = pkg.country
        if (!acc[key]) acc[key] = []
        acc[key].push(pkg)
        return acc
      },
      {}
    )
  }, [filteredPackages])

  if (loading) {
    return <div className="p-10 text-center">Chargement des destinations…</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      {/* HEADER */}
      <div className="max-w-7xl mx-auto mb-8">
        <h1 className="text-3xl font-bold mb-2">Boutique eSIM</h1>
        <p className="text-gray-600">
          Sélectionnez une destination et choisissez un forfait eSIM
        </p>
      </div>

      {/* SEARCH */}
      <div className="max-w-7xl mx-auto mb-10">
        <input
          type="text"
          placeholder="Rechercher une destination (ex: France, Japon...)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md border rounded-lg px-4 py-2 focus:outline-none focus:ring"
        />
      </div>

      {/* DESTINATIONS */}
      <div className="max-w-7xl mx-auto space-y-12">
        {Object.entries(packagesByCountry).map(([country, pkgs]) => (
          <section key={country}>
            <h2 className="text-2xl font-semibold mb-4">{country}</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {pkgs.map((pkg) => (
                <PackageCard key={pkg.id} pkg={pkg} />
              ))}
            </div>
          </section>
        ))}

        {Object.keys(packagesByCountry).length === 0 && (
          <p className="text-gray-500 text-center">
            Aucune destination ne correspond à votre recherche.
          </p>
        )}
      </div>
    </div>
  )
}
