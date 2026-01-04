import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  const url = request.nextUrl.clone()

  // 1. Autoriser l'accès au logo et aux images sans être connecté
  const isPublicAsset = url.pathname.match(/\.(png|jpg|jpeg|gif|svg|ico)$/)
  
  // 2. Si l'utilisateur n'est pas connecté et essaie d'accéder à autre chose que /login ou un logo
  if (!session && !url.pathname.startsWith('/login') && !isPublicAsset) {
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // 3. Si l'utilisateur est déjà connecté et essaie d'aller sur /login, on l'envoie au Dashboard
  if (session && url.pathname.startsWith('/login')) {
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return response
}

// Le "Matcher" définit sur quelles pages le middleware s'exécute
export const config = {
  matcher: [
    /*
     * On exclut les routes internes de Next.js (_next/static, _next/image, etc.)
     * et les fichiers dans public (favicon, images) pour éviter les boucles
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
