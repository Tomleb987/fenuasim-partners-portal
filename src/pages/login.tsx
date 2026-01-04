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
    setLoading(true);
    
    console.log("1. Tentative de connexion lancée pour :", email);

    try {
      console.log("2. Appel à Supabase...");
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        console.error("3. Erreur reçue de Supabase :", error.message);
        alert("Erreur : " + error.message);
      } else {
        console.log("4. Connexion réussie, session créée :", data.session);
        alert("Succès ! Redirection vers le tableau de bord...");
        router.push('/');
      }
    } catch (err) {
      console.error("Erreur système imprévue :", err);
      alert("Erreur système : " + err);
    } finally {
      setLoading(false);
      console.log("5. Fin de la procédure.");
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-purple-50/30 to-orange-100 overflow-hidden font-sans text-gray-900">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-300/30 rounded-full blur-3xl opacity-70"></div>
      
      <div className="relative z-10 w-full max-w-md px-6">
        <div className="bg-white/80 backdrop-blur-2xl p-10 rounded-[2.5rem] shadow-2xl border border-white text-center">
          <div className="mb-10 flex flex-col items-center">
            <div className="relative h-40 w-full mb-10">
              <Image src="/logo-1.png" alt="Logo" fill className="object-contain" priority />
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-bold uppercase tracking-widest">
              <ShieldCheck className="w-3 h-3" /> Accès Partenaire
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <input 
              type="email" placeholder="Email" required
              className="w-full p-4 bg-white/50 border border-purple-100 rounded-2xl outline-none"
              onChange={(e) => setEmail(e.target.value)} 
            />
            <input 
              type="password" placeholder="Mot de passe" required
              className="w-full p-4 bg-white/50 border border-purple-100 rounded-2xl outline-none"
              onChange={(e) => setPassword(e.target.value)} 
            />
            <button 
              type="submit" disabled={loading}
              className="w-full bg-purple-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Connexion en cours...' : 'Se connecter'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
