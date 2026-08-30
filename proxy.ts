import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/settings(.*)',
  '/profile(.*)',
  '/applications(.*)',
  '/saved(.*)',
  '/email-reports(.*)',
  '/analytics(.*)',
  '/companies(.*)',
  '/admin(.*)',
  '/internships(.*)',
  '/jobs(.*)',
  '/resume(.*)',
  '/cover-letter(.*)',
  '/copilot(.*)',
  '/interview(.*)',
  '/career(.*)',
  '/onboarding(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  // If user is authenticated and visits the root landing page '/', redirect to '/dashboard'
  if (userId && req.nextUrl.pathname === '/') {
    const dashboardUrl = new URL('/dashboard', req.url);
    return Response.redirect(dashboardUrl);
  }

  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
