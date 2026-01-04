import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";

export function supabaseBrowser() {
  return createPagesBrowserClient();
}
