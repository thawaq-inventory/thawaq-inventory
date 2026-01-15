import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createMiddleware(routing);

export default function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Define locales found in routing
    // We manually list them to avoid import issues if routing.ts structure is complex, 
    // but better to allow any 2-letter code if we want to be generic, or specific ones.
    // Based on previous findings, likely 'en' and 'ar'.

    // Normalize path by removing locale prefix if present
    // e.g. /en/admin -> /admin
    const pathWithoutLocale = pathname.replace(/^\/(en|ar)/, '') || '/';

    // Check if it's an admin route
    // Matches /admin, /admin/..., /en/admin, /ar/admin...
    const isAdminRoute = pathWithoutLocale.startsWith('/admin');

    // Check if it is a public auth route (login/logout)
    const isLoginRoute = pathWithoutLocale.startsWith('/admin/login');
    const isLogoutRoute = pathWithoutLocale.startsWith('/admin/logout');

    if (isAdminRoute && !isLoginRoute && !isLogoutRoute) {
        const token = req.cookies.get('auth_token')?.value;

        if (!token) {
            // Get locale to redirect efficiently
            // If path starts with /ar, use ar. Else default to en.
            const locale = pathname.startsWith('/ar') ? 'ar' : 'en';
            return NextResponse.redirect(new URL(`/${locale}/admin/login`, req.url));
        }
    }

    return intlMiddleware(req);
}

export const config = {
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
