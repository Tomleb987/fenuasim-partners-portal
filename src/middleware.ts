import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

function getEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  return { url, anonKey };
}

function createSupabase(req: NextRequest, res: NextResponse) {
  const { url, anonKey } = getEnv();

  return createServerClient(url, anonKey, {
    cookies: {
      get(name: string) {
        return req.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        // NextResponse cookies API
        res.cookies.set({
          name,
          value,
          ...options,
        });
      },
      remove(name: string, options: any) {
        res.cookies.set({
          name,
          value: "",
          ...options,
          maxAge: 0,
        });
      },
    },
  });
}

export async function middleware(req: NextRequest) {
  // Laisse Stripe webhook public
  if (req.nextUrl.pathname.startsWith("/api/stripe/webhook")) {
    return NextResponse.next();
  }

  const res = NextResponse.next();
  const supabase = createSupabase(req, res);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const publicPaths = ["/", "/login"];
  const isPublic = publicPaths.includes(req.nextUrl.pathname);

  // Bloquer uniquement les pages (pas les /api/*)
  const isApi = req.nextUrl.pathname.startsWith("/api");

  if (!session && !isPublic && !isApi) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirect", req.nextUrl.pathname);

    const redirectRes = NextResponse.redirect(redirectUrl);

    // Copie les cookies éventuels posés par Supabase
    res.cookies.getAll().forEach((c) => redirectRes.cookies.set(c));

    return redirectRes;
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
