import type { GetServerSidePropsContext } from "next";
import type { NextApiRequest, NextApiResponse } from "next";
import { createServerClient } from "@supabase/ssr";

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

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return Object.entries(ctx.req.cookies).map(([name, value]) => ({ name, value }));
      },
      setAll(cookies) {
        cookies.forEach(({ name, value, options }) => {
          ctx.res.setHeader("Set-Cookie", [
            ...([] as string[]).concat(ctx.res.getHeader("Set-Cookie") as any || []),
            serializeCookie(name, value, options),
          ]);
        });
      },
    },
  });
}

export function supabaseServerFromApi(req: NextApiRequest, res: NextApiResponse) {
  const { url, anonKey } = getEnv();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return Object.entries(req.cookies).map(([name, value]) => ({ name, value }));
      },
      setAll(cookies) {
        const existing = res.getHeader("Set-Cookie");
        const existingArr = Array.isArray(existing) ? existing : existing ? [String(existing)] : [];
        const nextArr = cookies.map(({ name, value, options }) => serializeCookie(name, value, options));
        res.setHeader("Set-Cookie", [...existingArr, ...nextArr]);
      },
    },
  });
}

/**
 * Petit helper cookie pour éviter d’ajouter une dépendance.
 * (Compatible avec les options principales utilisées par Supabase.)
 */
function serializeCookie(
  name: string,
  value: string,
  options: any = {}
) {
  const enc = encodeURIComponent;
  let str = `${name}=${enc(value)}`;

  if (options.maxAge != null) str += `; Max-Age=${Math.floor(options.maxAge)}`;
  if (options.domain) str += `; Domain=${options.domain}`;
  if (options.path) str += `; Path=${options.path}`;
  else str += `; Path=/`;

  if (options.expires) str += `; Expires=${options.expires.toUTCString()}`;
  if (options.httpOnly) str += `; HttpOnly`;
  if (options.secure) str += `; Secure`;
  if (options.sameSite) str += `; SameSite=${options.sameSite}`;

  return str;
}
