import { useEffect, useState } from 'react';
// Correction de l'import : on utilise le chemin relatif au lieu de l'alias @
import { supabase } from '../lib/supabase';

export default function PartnerDashboard() {
  const [sales, setSales] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // 1. Récupérer l'utilisateur connecté
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 2. Récupérer son profil partenaire
        const { data: prof, error: profError } = await supabase
          .from('partner_profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profError) throw profError;
        setProfile(prof);

        // 3. Récupérer les ventes associées à son code partenaire
        if (prof?.partner_code) {
          const { data: ord, error: ordError } = await supabase
            .from('orders')
            .select('*')
            .eq('partner_code', prof.partner_code)
            .order('created_at', { ascending: false });
          
          if (ordError) throw ordError;
          setSales(ord || []);
        }
      } catch (err) {
        console.error("Erreur de chargement :", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="p-8 text-center">Chargement de votre espace...</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto font-sans">
      <header className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bienvenue, {profile?.advisor_name || 'Partenaire'}</h1>
          <p className="text-gray-500">Suivi de vos performances en temps réel</p>
        </div>
        <button 
          onClick={() => supabase.auth.signOut()}
          className="text-sm font-medium text-red-600 hover:text-red-800"
        >
          Déconnexion
        </button>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
          <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Ventes totales</p>
          <p className="text-4xl font-black text-blue-600 mt-2">{sales.length}</p>
        </div>
        <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
          <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Mon Code Promo</p>
          <p className="text-4xl font-black text-green-600 mt-2">{profile?.partner_code || '---'}</p>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Historique des commandes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-600 text-sm uppercase">
              <tr>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Référence</th>
                <th className="px-6 py-4 font-semibold">Montant</th>
                <th className="px-6 py-4 font-semibold">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sales.length > 0 ? sales.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {new Date(order.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-gray-500">
                    #{order.id.slice(0, 8)}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900">
                    {order.total_amount || 0} €
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">
                      {order.status || 'Validé'}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-gray-400">
                    Aucune vente enregistrée pour le moment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
