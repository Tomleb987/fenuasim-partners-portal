import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { ShieldCheck } from "lucide-react"

export default function PartnerShop() {
  const [packages, setPackages] = useState<any[]>([])
  const [partner, setPartner] = useState<any>(null)

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const { data: prof } = await supabase.from('partner_profiles').select('*').eq('id', session.user?.id).single()
      setPartner(prof)

      const { data: pkg } = await supabase.from('airalo_packages').select('*').limit(20)
      setPackages(pkg || [])
    }
    init()
  }, [])

  const startCheckout = async (p: any) => {
    const res = await fetch('/api/stripe/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        packageId: p.id,
        price: p.final_price_eur,
        name: p.name,
        partnerCode: partner.partner_code 
      })
    })
    const { url } = await res.json()
    window.location.href = url
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-purple-900 text-white p-3 text-center text-xs font-bold uppercase tracking-tighter">
        <ShieldCheck className="inline mr-2" size={14} /> Boutique Partenaire Active : {partner?.partner_code}
      </div>
      <div className="max-w-7xl mx-auto p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        {packages.map(p => (
          <div key={p.id} className="bg-white p-6 rounded-3xl shadow-sm border">
            <h3 className="font-bold text-xl">{p.name}</h3>
            <p className="text-3xl font-black mt-4">{p.final_price_eur}€</p>
            <button onClick={() => startCheckout(p)} className="w-full mt-6 bg-purple-600 text-white py-3 rounded-xl font-bold">Acheter</button>
          </div>
        ))}
      </div>
    </div>
  )
}
