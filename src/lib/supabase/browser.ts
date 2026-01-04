import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";

export const supabaseBrowser = () => {
  return createPagesBrowserClient();
};
