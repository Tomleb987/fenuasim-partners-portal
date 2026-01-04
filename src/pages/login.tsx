import { useState } from "react";
import { useRouter } from "next/router";
import { supabaseBrowser } from "@/lib/supabase/browser";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectTo = (router.query.redirect as string) || "/shop";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);
    if (error) return setError(error.message);

    router.push(redirectTo);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold">Connexion partenaire</h1>

        <input className="w-full border p-2 rounded" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="Email" />
        <input className="w-full border p-2 rounded" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Mot de passe" />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button disabled={loading} className="w-full bg-black text-white p-2 rounded">
          {loading ? "Connexion..." : "Se connecter"}
        </button>
      </form>
    </div>
  );
}
