import { createClient } from '@supabase/supabase-js'

// Ces variables doivent être définies dans Vercel
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("ATTENTION : Les clés Supabase sont manquantes dans les variables d'environnement !")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
