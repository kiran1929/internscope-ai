import { SignIn } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { Compass } from 'lucide-react';
import Link from 'next/link';

export default function SignInPage() {
  return (
    <div className="flex-1 min-h-screen flex flex-col items-center justify-center bg-[#09090B] relative py-12 px-4 sm:px-6 lg:px-8">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f29370a_1px,transparent_1px),linear-gradient(to_bottom,#1f29370a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full filter blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 group justify-center">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white shadow-md shadow-primary/20 group-hover:scale-105 transition-transform">
              <Compass className="w-5.5 h-5.5" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-white">
              InternScope<span className="text-primary font-black">AI</span>
            </span>
          </Link>
          <p className="text-xs text-text-muted mt-2">Sign in to manage your internship pipeline</p>
        </div>

        {/* Clerk Sign In component */}
        <div className="flex justify-center">
          <SignIn
            appearance={{
              baseTheme: dark,
              variables: {
                colorPrimary: '#2563EB',
                colorBackground: '#18181B',
                colorText: '#FAFAFA',
                colorTextSecondary: '#A1A1AA',
              } as any,
              elements: {
                cardBox: 'border border-zinc-800 shadow-2xl rounded-2xl overflow-hidden w-full max-w-md',
                headerTitle: '!text-white text-base font-bold font-display',
                headerSubtitle: '!text-zinc-400 text-xs',
                socialButtonsBlockButton: 'bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 hover:border-zinc-700 !text-white font-semibold text-xs py-2 rounded-lg transition-colors',
                socialButtonsBlockButtonText: '!text-white font-medium',
                formButtonPrimary: 'bg-primary hover:bg-blue-700 !text-white font-bold py-2 rounded-lg transition-colors shadow-md shadow-primary/10',
                formFieldLabel: '!text-zinc-300 text-xs font-semibold',
                formFieldInput: '!bg-zinc-900 border border-zinc-800 focus:border-primary !text-white rounded-lg text-xs py-2',
                footerActionText: '!text-zinc-400 text-xs',
                footerActionLink: '!text-primary hover:!text-blue-400 hover:underline font-semibold text-xs',
                dividerText: '!text-zinc-400 text-xs',
                dividerLine: '!bg-zinc-800',
                footer: 'hidden',
              },
            } as any}
          />
        </div>
      </div>
    </div>
  );
}
