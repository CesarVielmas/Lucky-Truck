import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(req: NextRequest) {
  const url = req.nextUrl.clone();
  const role = req.cookies.get('role')?.value;
  if (!role && url.pathname.startsWith("/dashboard")) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  if (url.pathname === "/dashboard" || url.pathname.startsWith("/dashboard/")) {
    if (role === "admin") {
      url.pathname = `/admin/dashboard${url.pathname.replace("/dashboard", "")}`;
      return NextResponse.rewrite(url);
    } else if (role === "user") {
      url.pathname = `/user/dashboard${url.pathname.replace("/dashboard", "")}`;
      return NextResponse.rewrite(url);
    }
  }
  if (
    url.pathname.startsWith('/admin/dashboard') ||
    url.pathname.startsWith('/user/dashboard')
  ) {
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard',
    '/dashboard/:path*', 
    '/admin/dashboard',
    '/user/dashboard',
  ],
};
