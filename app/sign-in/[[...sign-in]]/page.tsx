import { SignIn } from '@clerk/nextjs';
import { Compass } from 'lucide-react';
import Link from 'next/link';
import { authClerkAppearance } from '@/lib/clerk/auth-appearance';

export default function SignInPage() {
  return (
    <div className="auth-clerk flex-1 min-h-screen flex flex-col items-center justify-center bg-slate-50 relative py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f015_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f015_1px,transparent_1px)] bg-[size:20px_28px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[640px] h-[640px] bg-blue-500/[0.07] rounded-full filter blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md space-y-7">
        <div className="text-center space-y-2.5">
          <Link href="/" className="inline-flex items-center gap-2.5 group justify-center">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-md shadow-primary/25 group-hover:scale-105 transition-transform">
              <Compass className="w-5 h-5" />
            </div>
            <span className="font-display font-extrabold text-2xl tracking-tight text-slate-900">
              InternScope<span className="text-primary font-black">AI</span>
            </span>
          </Link>
          <p className="text-sm text-slate-500 font-medium">
            Sign in to manage your internship pipeline
          </p>
        </div>

        <div className="flex justify-center w-full">
          <SignIn
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
            forceRedirectUrl="/dashboard"
            appearance={authClerkAppearance}
          />
        </div>
      </div>
    </div>
  );
}
