export const PUBLIC_ROUTES = [
  '/',
  '/pricing',
  '/about',
  '/sign-in(.*)',
  '/sign-up(.*)',
];

export const PROTECTED_ROUTES = [
  '/dashboard(.*)',
  '/settings(.*)',
  '/profile(.*)',
  '/applications(.*)',
  '/saved(.*)',
  '/email-reports(.*)',
  '/analytics(.*)',
  '/companies(.*)',
];

export const ROUTE_REDIRECTS = {
  signIn: '/sign-in',
  signUp: '/sign-up',
  afterSignIn: '/dashboard',
  afterSignUp: '/dashboard',
  afterSignOut: '/',
};
