import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import type { GetServerSidePropsContext } from "next";
import type { NextApiRequest, NextApiResponse } from "next";

export function supabaseServerFromGssp(ctx: GetServerSidePropsContext) {
  return createPagesServerClient(ctx);
}

export function supabaseServerFromApi(req: NextApiRequest, res: NextApiResponse) {
  return createPagesServerClient({ req, res });
}
