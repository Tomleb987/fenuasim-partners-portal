import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // Vérification de l'utilisateur
  const { data: { user } } = await supabase.auth.getUser()

  const isLoginPage = request.nextUrl.pathname.startsWith('/login')
  const isPublicAsset = request.nextUrl.pathname.match(/\.(png|jpg|jpeg|gif|svg|ico)$/)

  // 1. Si pas d'utilisateur et page protégée -> Rediriger vers login
  if (!user && !isLoginPage && !isPublicAsset) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 2. Si utilisateur déjà connecté et sur login -> Rediriger vers l'accueil
  if (user && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
