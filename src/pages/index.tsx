import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function PartnerDashboard() {
  const [sales, setSales] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const fetchStats = async () => {
      // 1. Récupérer le profil du conseiller connecté
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: prof } = await supabase
        .from('partner_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      setProfile(prof);

      // 2. Récupérer ses ventes dans la table orders (colonne partner_code)
      if (prof?.partner_code) {
        const { data: ord } = await supabase
          .from('orders')
          .select('*')
          .eq('partner_code', prof.partner_code)
          .order('created_at', { ascending: false });
        
        setSales(ord || []);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Tableau de bord : {profile?.advisor_name}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="p-4 bg-blue-50 rounded-lg shadow">
          <p className="text-sm text-blue-600">Ventes totales</p>
          <p className="text-2xl font-bold">{sales.length}</p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg shadow">
          <p className="text-sm text-green-600">Lien de parrainage</p>
          <p className="text-xs truncate">fenuasim.com/partners/{profile?.partner_code}</p>
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-4">Dernières ventes</h2>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b">
            <th className="py-2">Date</th>
            <th className="py-2">Montant</th>
            <th className="py-2">Statut</th>
          </tr>
        </thead>
        <tbody>
          {sales.map((order) => (
            <tr key={order.id} className="border-b text-sm">
              <td className="py-2">{new Date(order.created_at).toLocaleDateString()}</td>
              <td className="py-2">{order.total_amount} €</td>
              <td className="py-2">{order.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
