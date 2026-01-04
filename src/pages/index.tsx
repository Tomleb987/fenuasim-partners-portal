import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import { Smartphone, ShieldCheck, Wifi } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert("Erreur : " + error.message);
    else router.push('/');
    setLoading(false);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-purple-50/30 to-orange-100 overflow-hidden font-sans">
      {/* Éléments de design (Bulles de couleur comme sur l'accueil) */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-300/30 rounded-full blur-3xl opacity-70 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-orange-300/30 rounded-full blur-3xl opacity-70 pointer-events-none"></div>

      <div className="relative z-10 max-w-md w-full px-4">
        <div className="bg-white/80 backdrop-blur-xl p-10 rounded-[2rem] shadow-2xl border border-white/50">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              FENUA<span className="text-orange-500">SIM</span>
            </h1>
            <p className="text-purple-700 text-sm font-bold mt-2 uppercase tracking-widest flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Espace Partenaire
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <input 
                type="email" placeholder="Email professionnel" required
                className="w-full p-4 bg-white border border-purple-100 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none transition-all shadow-sm"
                onChange={(e) => setEmail(e.target.value)} 
              />
            </div>
            <div>
              <input 
                type="password" placeholder="Mot de passe" required
                className="w-full p-4 bg-white border border-purple-100 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none transition-all shadow-sm"
                onChange={(e) => setPassword(e.target.value)} 
              />
            </div>
            <button 
              type="submit" disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-purple-200 transition-all active:scale-95"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <div className="mt-8 flex justify-center gap-6 text-purple-400">
             <Wifi className="w-5 h-5" />
             <Smartphone className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  );
}
