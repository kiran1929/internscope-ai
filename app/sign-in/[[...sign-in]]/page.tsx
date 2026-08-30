import { SignIn } from '@clerk/nextjs';
import { Compass } from 'lucide-react';
import Link from 'next/link';

export default function SignInPage() {
  return (
    <div className="flex-1 min-h-screen flex flex-col items-center justify-center bg-slate-50 relative py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Soft light grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f00f_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f00f_1px,transparent_1px)] bg-[size:16px_28px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full filter blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2.5 group justify-center">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-md shadow-primary/25 group-hover:scale-105 transition-transform">
              <Compass className="w-5.5 h-5.5" />
            </div>
            <span className="font-display font-extrabold text-2xl tracking-tight text-slate-900">
              InternScope<span className="text-primary font-black">AI</span>
            </span>
          </Link>
          <p className="text-xs text-slate-500 font-medium">Sign in to manage your internship pipeline</p>
        </div>

        {/* Clerk Sign In component */}
        <div className="flex justify-center">
          <SignIn
            appearance={{
              variables: {
                colorPrimary: '#2563EB',
                colorBackground: '#FFFFFF',
                colorInputBackground: '#FFFFFF',
                colorInputText: '#0F172A',
                colorText: '#0F172A',
                colorTextSecondary: '#64748B',
                colorTextOnPrimaryBackground: '#FFFFFF',
              } as any,
              elements: {
                cardBox: 'border border-slate-200 shadow-xl rounded-2xl overflow-hidden w-full max-w-md bg-white',
                card: 'bg-white p-6',
                headerTitle: '!text-slate-900 text-lg font-bold font-display',
                headerSubtitle: '!text-slate-500 text-xs mt-1',
                socialButtonsBlockButton: 'bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 !text-slate-700 font-semibold text-xs py-2.5 rounded-xl transition-all shadow-xs',
                socialButtonsBlockButtonText: '!text-slate-700 font-bold text-xs',
                socialButtonsBlockButtonArrow: '!text-slate-500',
                formButtonPrimary: 'bg-primary hover:bg-blue-700 !text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-md shadow-primary/20',
                formFieldLabel: '!text-slate-700 text-xs font-semibold mb-1.5',
                formFieldInput: '!bg-white border border-slate-300 focus:border-primary !text-slate-900 rounded-xl text-xs py-2.5 px-3 transition-colors shadow-xs',
                footerActionText: '!text-slate-500 text-xs',
                footerActionLink: '!text-primary hover:!text-blue-700 hover:underline font-bold text-xs',
                dividerText: '!text-slate-400 text-xs font-medium',
                dividerLine: '!bg-slate-200',
                identityPreviewText: '!text-slate-900 text-xs font-medium',
                identityPreviewEditButton: '!text-primary hover:!text-blue-700 text-xs',
                formHeaderTitle: '!text-slate-900 text-base font-bold',
                formHeaderSubtitle: '!text-slate-500 text-xs',
                footer: 'bg-slate-50/50 border-t border-slate-100',
              },
            } as any}
          />
        </div>
      </div>
    </div>
  );
}
