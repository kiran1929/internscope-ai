import { SignUp } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { Compass } from 'lucide-react';
import Link from 'next/link';

export default function SignUpPage() {
  return (
    <div className="flex-1 min-h-screen flex flex-col items-center justify-center bg-[#09090B] relative py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f29370a_1px,transparent_1px),linear-gradient(to_bottom,#1f29370a_1px,transparent_1px)] bg-[size:16px_28px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full filter blur-[140px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2.5 group justify-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-blue-400 flex items-center justify-center text-white shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
              <Compass className="w-5.5 h-5.5" />
            </div>
            <span className="font-display font-extrabold text-2xl tracking-tight text-white">
              InternScope<span className="text-primary font-black">AI</span>
            </span>
          </Link>
          <p className="text-xs text-zinc-400">Sign up to monitor openings from top tech hubs</p>
        </div>

        {/* Clerk Sign Up component */}
        <div className="flex justify-center">
          <SignUp
            appearance={{
              baseTheme: dark,
              variables: {
                colorPrimary: '#2563EB',
                colorBackground: '#18181B',
                colorInputBackground: '#09090B',
                colorInputText: '#FFFFFF',
                colorText: '#FFFFFF',
                colorTextSecondary: '#A1A1AA',
                colorTextOnPrimaryBackground: '#FFFFFF',
              } as any,
              elements: {
                cardBox: 'border border-zinc-800 shadow-2xl rounded-2xl overflow-hidden w-full max-w-md bg-zinc-900/90 backdrop-blur-xl',
                card: 'bg-zinc-900/90 p-6',
                headerTitle: '!text-white text-lg font-bold font-display',
                headerSubtitle: '!text-zinc-400 text-xs mt-1',
                socialButtonsBlockButton: 'bg-zinc-950 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 !text-white font-semibold text-xs py-2.5 rounded-xl transition-all shadow-sm',
                socialButtonsBlockButtonText: '!text-white font-bold text-xs',
                socialButtonsBlockButtonArrow: '!text-white',
                formButtonPrimary: 'bg-primary hover:bg-blue-600 !text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-lg shadow-primary/20 hover:shadow-primary/35',
                formFieldLabel: '!text-zinc-300 text-xs font-semibold mb-1.5',
                formFieldInput: '!bg-zinc-950 border border-zinc-800 focus:border-primary !text-white rounded-xl text-xs py-2.5 px-3 transition-colors',
                footerActionText: '!text-zinc-400 text-xs',
                footerActionLink: '!text-primary hover:!text-blue-400 hover:underline font-bold text-xs',
                dividerText: '!text-zinc-400 text-xs font-medium',
                dividerLine: '!bg-zinc-800',
                identityPreviewText: '!text-white text-xs font-medium',
                identityPreviewEditButton: '!text-primary hover:!text-blue-400 text-xs',
                formHeaderTitle: '!text-white text-base font-bold',
                formHeaderSubtitle: '!text-zinc-400 text-xs',
                footer: '!text-zinc-500',
              },
            } as any}
          />
        </div>
      </div>
    </div>
  );
}
