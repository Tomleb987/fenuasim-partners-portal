import { createServerClient } from "@supabase/auth-helpers-nextjs";
import type { GetServerSidePropsContext } from "next";
import type { NextApiRequest, NextApiResponse } from "next";

function getEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  return { url, anonKey };
}

export function supabaseServerFromGssp(ctx: GetServerSidePropsContext) {
  const { url, anonKey } = getEnv();
  return createServerClient(url, anonKey, { req: ctx.req, res: ctx.res });
}

export function supabaseServerFromApi(req: NextApiRequest, res: NextApiResponse) {
  const { url, anonKey } = getEnv();
  return createServerClient(url, anonKey, { req, res });
}
