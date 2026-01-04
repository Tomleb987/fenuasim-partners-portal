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

function appendSetCookie(res: { getHeader: any; setHeader: any }, cookie: string) {
  const prev = res.getHeader("Set-Cookie");
  const prevArr = Array.isArray(prev) ? prev : prev ? [String(prev)] : [];
  res.setHeader("Set-Cookie", [...prevArr, cookie]);
}

function serializeCookie(name: string, value: string, options: any = {}) {
  const enc = encodeURIComponent;
  let str = `${name}=${enc(value)}`;

  if (options.maxAge != null) str += `; Max-Age=${Math.floor(options.maxAge)}`;
  if (options.domain) str += `; Domain=${options.domain}`;
  str += `; Path=${options.path ?? "/"}`;

  if (options.expires) str += `; Expires=${options.expires.toUTCString()}`;
  if (options.httpOnly) str += `; HttpOnly`;
  if (options.secure) str += `; Secure`;
  if (options.sameSite) str += `; SameSite=${options.sameSite}`;

  return str;
}

export function supabaseServerFromGssp(ctx: GetServerSidePropsContext) {
  const { url, anonKey } = getEnv();

  return createServerClient(url, anonKey, {
    cookies: {
      get(name: string) {
        const v = (ctx.req as any).cookies?.[name];
        return typeof v === "string" ? v : undefined;
      },
      set(name: string, value: string, options: any) {
        appendSetCookie(ctx.res, serializeCookie(name, value, options));
      },
      remove(name: string, options: any) {
        // remove = set cookie expiré
        appendSetCookie(
          ctx.res,
          serializeCookie(name, "", { ...options, maxAge: 0, expires: new Date(0) })
        );
      },
    },
  });
}

export function supabaseServerFromApi(req: NextApiRequest, res: NextApiResponse) {
  const { url, anonKey } = getEnv();

  return createServerClient(url, anonKey, {
    cookies: {
      get(name: string) {
        const v = (req as any).cookies?.[name];
        return typeof v === "string" ? v : undefined;
      },
      set(name: string, value: string, options: any) {
        appendSetCookie(res, serializeCookie(name, value, options));
      },
      remove(name: string, options: any) {
        appendSetCookie(res, serializeCookie(name, "", { ...options, maxAge: 0, expires: new Date(0) }));
      },
    },
  });
}
