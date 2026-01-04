import { useEffect, useMemo, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import PackageCard, { AiraloPackage } from "@/components/shop/PackageCard";

type CountryMeta = {
  country: string;
  count: number;
  minPrice: number;
};

function safeNumber(v: unknown, fallback = 0) {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export default function Shop() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const packagesSectionRef = useRef<HTMLDivElement | null>(null);

  const [packages, setPackages] = useState<AiraloPackage[]>([]);
  const [loading, setLoading] = useState(true);

  // Search destinations
  const [search, setSearch] = useState("");

  // Selected destination (country)
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadPackages = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("airalo_packages")
        .select("*")
        .order("country", { ascending: true });

      if (!mounted) return;

      if (!error && data) {
        const rows = data as AiraloPackage[];
        setPackages(rows);

        // auto-select first country (optional)
        const first = rows?.[0]?.country;
        if (first) setSelectedCountry((prev) => prev ?? first);
      }

      setLoading(false);
    };

    loadPackages();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  // Build countries list from packages
  const countries = useMemo<CountryMeta[]>(() => {
    const map = new Map<string, { count: number; minPrice: number }>();

    for (const p of packages) {
      const key = (p.country || "").trim();
      if (!key) continue;

      const price = safeNumber((p as any).final_price_eur, 0);

      const existing = map.get(key);
      if (!existing) {
        map.set(key, { count: 1, minPrice: price > 0 ? price : Infinity });
      } else {
        existing.count += 1;
        if (price > 0) existing.minPrice = Math.min(existing.minPrice, price);
        map.set(key, existing);
      }
    }

    const list: CountryMeta[] = Array.from(map.entries()).map(([country, v]) => ({
      country,
      count: v.count,
      minPrice: Number.isFinite(v.minPrice) ? v.minPrice : 0,
    }));

    // Sort by name
    list.sort((a, b) => a.country.localeCompare(b.country, "fr"));

    return list;
  }, [packages]);

  // Filter countries by search query
  const filteredCountries = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter((c) => c.country.toLowerCase().includes(q));
  }, [countries, search]);

  // Packages for selected country (and search can also narrow by plan name if you want)
  const selectedPackages = useMemo(() => {
    if (!selectedCountry) return [];

    // Option: if search is filled, also filter packages by name (nice UX)
    const q = search.trim().toLowerCase();

    return packages
      .filter((p) => p.country === selectedCountry)
      .filter((p) => {
        if (!q) return true;
        return (
          p.country.toLowerCase().includes(q) ||
          (p.name || "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => safeNumber(a.final_price_eur) - safeNumber(b.final_price_eur));
  }, [packages, selectedCountry, search]);

  const onSelectCountry = (country: string) => {
    setSelectedCountry(country);

    // Scroll to packages section for smooth UX
    setTimeout(() => {
      packagesSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  if (loading) {
    return <div className="p-10 text-center">Chargement des destinations…</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      {/* HEADER */}
      <div className="max-w-7xl mx-auto mb-6">
        <h1 className="text-3xl font-bold mb-2">Boutique eSIM</h1>
        <p className="text-gray-600">
          1) Choisis une destination &nbsp;→&nbsp; 2) Sélectionne un forfait
        </p>
      </div>

      {/* SEARCH */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="w-full sm:w-[420px]">
          <input
            type="text"
            placeholder="Rechercher une destination (France, Japon...)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border rounded-lg px-4 py-2 focus:ring focus:outline-none bg-white"
          />
          <p className="text-xs text-gray-500 mt-2">
            Astuce : tu peux aussi rechercher par nom d’offre (ex: “5GB”, “30 days”…)
          </p>
        </div>

        {selectedCountry && (
          <div className="text-sm text-gray-700">
            Destination sélectionnée :{" "}
            <span className="font-bold">{selectedCountry}</span>
          </div>
        )}
      </div>

      {/* DESTINATIONS GRID */}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-4">
          <h2 className="text-xl font-semibold">Destinations</h2>
          <span className="text-sm text-gray-500">
            {filteredCountries.length} destination{filteredCountries.length > 1 ? "s" : ""}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {filteredCountries.map((c) => {
            const active = c.country === selectedCountry;

            return (
              <button
                key={c.country}
                onClick={() => onSelectCountry(c.country)}
                className={[
                  "text-left rounded-xl border px-4 py-3 bg-white hover:shadow-sm transition",
                  active ? "border-black ring-1 ring-black" : "border-gray-200",
                ].join(" ")}
              >
                <div className="font-bold truncate">{c.country}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {c.count} forfait{c.count > 1 ? "s" : ""}
                </div>
                <div className="text-xs text-gray-700 mt-2">
                  Dès <span className="font-bold">{(c.minPrice || 0).toFixed(2)}€</span>
                </div>
              </button>
            );
          })}
        </div>

        {filteredCountries.length === 0 && (
          <div className="text-center text-gray-500 py-10">
            Aucune destination ne correspond à ta recherche.
          </div>
        )}
      </div>

      {/* PACKAGES SECTION */}
      <div ref={packagesSectionRef} className="max-w-7xl mx-auto mt-12">
        <div className="flex items-end justify-between mb-4">
          <h2 className="text-xl font-semibold">
            Forfaits {selectedCountry ? `— ${selectedCountry}` : ""}
          </h2>
          <span className="text-sm text-gray-500">
            {selectedPackages.length} offre{selectedPackages.length > 1 ? "s" : ""}
          </span>
        </div>

        {!selectedCountry && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 text-gray-600">
            Sélectionne une destination ci-dessus pour voir les forfaits.
          </div>
        )}

        {selectedCountry && selectedPackages.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 text-gray-600">
            Aucun forfait trouvé pour cette destination (avec ta recherche actuelle).
          </div>
        )}

        {selectedCountry && selectedPackages.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {selectedPackages.map((pkg) => (
              <PackageCard key={pkg.id} pkg={pkg} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
