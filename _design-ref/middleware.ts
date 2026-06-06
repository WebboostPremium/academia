import { NextResponse, type NextRequest } from 'next/server'

const SESSION_COOKIE = 'cq_session'

const PROTECTED_PREFIXES = ['/estudiante', '/catequista', '/admin']
const AUTH_ROUTES = ['/login', '/registro', '/recuperar']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const session = request.cookies.get(SESSION_COOKIE)?.value

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))
  const isAuthRoute = AUTH_ROUTES.some((p) => pathname.startsWith(p))

  if (isProtected && !session) {
    const url = new URL('/login', request.url)
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL('/redireccion', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/estudiante/:path*',
    '/catequista/:path*',
    '/admin/:path*',
    '/login',
    '/registro',
    '/recuperar',
  ],
}
