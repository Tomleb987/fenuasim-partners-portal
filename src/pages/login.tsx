import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import { ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      alert("Erreur d'authentification : " + error.message);
    } else {
      router.push('/');
    }
    setLoading(false);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-purple-50/30 to-orange-100 overflow-hidden font-sans">
      {/* Éléments de design en arrière-plan (bulles de couleur) */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-300/30 rounded-full blur-3xl opacity-70 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-orange-300/30 rounded-full blur-3xl opacity-70 pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="bg-white/80 backdrop-blur-2xl p-10 rounded-[2.5rem] shadow-2xl border border-white">
          <div className="text-center mb-10">
            {/* Utilisation de logo 1.PNG situé dans le dossier public */}
            <img 
              src="/logo 1.PNG" 
              alt="Fenuasim Logo" 
              className="h-20 w-auto mx-auto mb-6" 
            />
            
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-bold uppercase tracking-widest">
              <ShieldCheck className="w-3 h-3" /> Accès Partenaire
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="email" 
              placeholder="Email professionnel" 
              required
              className="w-full p-4 bg-white/50 border border-purple-100 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none transition-all placeholder-gray-400 font-medium"
              onChange={(e) => setEmail(e.target.value)} 
            />
            <input 
              type="password" 
              placeholder="Mot de passe" 
              required
              className="w-full p-4 bg-white/50 border border-purple-100 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none transition-all placeholder-gray-400 font-medium"
              onChange={(e) => setPassword(e.target.value)} 
            />
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-purple-200 transition-all active:scale-95 disabled:opacity-70"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
