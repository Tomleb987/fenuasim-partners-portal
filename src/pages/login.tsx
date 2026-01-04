import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';

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
    <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-4 font-sans">
      <div className="max-w-md w-full">
        {/* Logo / Header Style Fenuasim */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-[#0f172a] tracking-tight">
            FENUA<span className="text-[#ff6b6b]">SIM</span>
          </h1>
          <p className="text-gray-500 mt-2 font-medium">Espace Partenaires & Conseillers</p>
        </div>

        <div className="bg-white p-10 rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100">
          <h2 className="text-xl font-bold text-[#0f172a] mb-6 text-center">Connexion</h2>
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Email professionnel</label>
              <input 
                type="email" 
                placeholder="nom@exemple.com" 
                required
                className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#ff6b6b]/20 focus:border-[#ff6b6b] outline-none transition-all"
                onChange={(e) => setEmail(e.target.value)} 
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Mot de passe</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                required
                className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#ff6b6b]/20 focus:border-[#ff6b6b] outline-none transition-all"
                onChange={(e) => setPassword(e.target.value)} 
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#ff6b6b] text-white py-4 rounded-2xl font-bold text-lg hover:bg-[#fa5252] shadow-lg shadow-red-200 transition-all active:scale-[0.98] disabled:opacity-70"
            >
              {loading ? 'Chargement...' : 'Se connecter'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-400">
            Accès réservé aux conseillers agréés Fenuasim.
          </p>
        </div>
      </div>
    </div>
  );
}
