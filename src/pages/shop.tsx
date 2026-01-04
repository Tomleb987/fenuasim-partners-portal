"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import { Star, ShieldCheck, ShoppingBag } from "lucide-react";

// On réutilise la logique de traduction de votre site public
const REGION_TRANSLATIONS: Record<string, string> = { "United States": "États-Unis", "France": "France", "Japan": "Japon" /* ... ajoutez les autres */ };

export default function PartnerShop() {
  const router = useRouter();
  const [partner, setPartner] = useState<any>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState<"EUR" | "XPF" | "USD">("EUR");

  useEffect(() => {
    const initShop = async () => {
      // 1. Vérification forcée du partenaire
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push('/login');

      const { data: profile } = await supabase.from('partner_profiles').select('*').eq('id', session.user.id).single();
      if (!profile || profile.status !== 'active') {
        alert("Profil inactif. Contactez l'administrateur.");
        return router.push('/');
      }
      setPartner(profile);

      // 2. Chargement des forfaits
      const { data: pkgData } = await supabase.from("airalo_packages").select("*").order("final_price_eur", { ascending: true });
      setPackages(pkgData || []);
      setLoading(false);
    };
    initShop();
  }, [router]);

  const handleCheckout = async (pkg: any) => {
    // Appel à votre API de session Stripe partenaire
    const res = await fetch('/api/stripe/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        cartItems: [{ ...pkg, partner_code: partner.partner_code }], 
        customer_email: partner.email 
      })
    });
    const { sessionId } = await res.json();
    // Redirection Stripe...
  };

  if (loading) return <div className="p-20 text-center font-black">Chargement de votre shop partenaire...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-purple-900 text-white py-3 px-6 flex justify-between items-center text-[10px] font-black uppercase tracking-widest sticky top-0 z-50">
        <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-orange-400" /> Boutique Officielle : {partner.advisor_name}</span>
        <span className="bg-white/10 px-3 py-1 rounded">VOTRE CODE : {partner.partner_code}</span>
      </div>
      
      <main className="max-w-7xl mx-auto p-8">
        <h1 className="text-4xl font-black mb-12">Sélectionnez une destination</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {/* Affichez ici vos composants DestinationCard ou PackageCard */}
        </div>
      </main>
    </div>
  );
}
