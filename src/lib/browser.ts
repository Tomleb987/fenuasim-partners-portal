import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export const supabaseBrowser = () => {
  return createClientComponentClient();
};
