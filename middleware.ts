import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(function middleware(req) {
  const { pathname } = req.nextUrl

  // Allow access to login page and health check
  if (pathname === '/login' || pathname === '/api/health') {
    return NextResponse.next()
  }

  // Allow access to auth API routes
  if (pathname.startsWith('/api/auth/')) {
    return NextResponse.next()
  }

  const token = req.nextauth?.token

  // Redirect unauthenticated users
  if (!token) {
    if (pathname === '/' || pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
  }

  // Redirect authenticated users away from login
  if (pathname === '/login' && token) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
