import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import { ShieldCheck } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // TEST DE SURVIE : Si vous voyez cette alerte, le bouton fonctionne !
    alert("Tentative de connexion pour : " + email);
    
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: email.trim(), 
        password: password 
      });
      
      if (error) {
        alert("Erreur Supabase : " + error.message);
      } else if (data.session) {
        router.push('/');
      }
    } catch (err) {
      alert("Erreur système : " + err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-purple-50/30 to-orange-100 font-sans text-gray-900">
      <div className="relative z-10 w-full max-w-md px-6">
        <div className="bg-white/80 backdrop-blur-2xl p-10 rounded-[2.5rem] shadow-2xl border border-white text-center">
          
          <div className="mb-10 flex flex-col items-center">
            <div className="relative h-40 w-full mb-6">
              <Image src="/logo-1.png" alt="Logo" fill className="object-contain" priority />
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-bold uppercase tracking-widest">
              <ShieldCheck className="w-3 h-3" /> Accès Partenaire
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <input 
                type="email" 
                placeholder="Email professionnel" 
                required
                className="w-full p-4 bg-white/50 border border-purple-100 rounded-2xl outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                onChange={(e) => setEmail(e.target.value)} 
              />
            </div>
            <div>
              <input 
                type="password" 
                placeholder="Mot de passe" 
                required
                className="w-full p-4 bg-white/50 border border-purple-100 rounded-2xl outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                onChange={(e) => setPassword(e.target.value)} 
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-purple-200 transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
