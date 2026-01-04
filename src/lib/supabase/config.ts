// src/lib/supabase/config.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

export type Database = any;
