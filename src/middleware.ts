import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // IMPORTANT: on laisse Stripe webhook tranquille
  if (req.nextUrl.pathname.startsWith("/api/stripe/webhook")) {
    return res;
  }

  // Routes publiques
  const publicPaths = ["/login", "/"];
  const isPublic = publicPaths.includes(req.nextUrl.pathname);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Si pas connecté et route non publique => redirect login
  if (!session && !isPublic && !req.nextUrl.pathname.startsWith("/api")) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirect", req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

export const config = {
  matcher: [
    /*
      On applique partout sauf:
      - assets Next
      - favicon
    */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
