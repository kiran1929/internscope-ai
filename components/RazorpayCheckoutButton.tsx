'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Zap, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface RazorpayCheckoutButtonProps {
  planTier: 'PRO_MONTHLY' | 'PRO_ANNUAL';
  planTitle: string;
  amountText: string;
  className?: string;
  isCurrentPlan?: boolean;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function RazorpayCheckoutButton({
  planTier,
  planTitle,
  amountText,
  className = '',
  isCurrentPlan = false,
}: RazorpayCheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleCheckout = async () => {
    if (isCurrentPlan) return;

    setLoading(true);

    try {
      // 1. Ensure Razorpay SDK is loaded
      const resScript = await loadRazorpayScript();
      if (!resScript) {
        toast.error('Failed to load Razorpay Checkout SDK. Please check your internet connection.');
        setLoading(false);
        return;
      }

      // 2. Create order on backend
      const res = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planTier }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.error || 'Could not initialize payment order.');
        setLoading(false);
        return;
      }

      // 3. Configure Razorpay Options
      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'InternScope AI',
        description: `Upgrade to ${planTitle}`,
        order_id: data.orderId,
        prefill: {
          name: data.user?.name || '',
          email: data.user?.email || '',
        },
        theme: {
          color: '#F59E0B',
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            toast.info('Payment checkout cancelled.');
          },
        },
        handler: async function (response: any) {
          setLoading(true);
          try {
            // 4. Verify Payment on Backend
            const verifyRes = await fetch('/api/razorpay/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();

            if (verifyRes.ok && verifyData.success) {
              toast.success('🎉 Upgrade successful! Premium features unlocked.');
              router.refresh();
              setTimeout(() => {
                router.push('/dashboard');
              }, 1200);
            } else {
              toast.error(verifyData.error || 'Payment verification failed.');
            }
          } catch (err: any) {
            console.error('Payment verification error:', err);
            toast.error('An error occurred while verifying your payment.');
          } finally {
            setLoading(false);
          }
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.on('payment.failed', function (response: any) {
        console.error('Razorpay payment failed:', response.error);
        toast.error(`Payment failed: ${response.error.description || 'Transaction declined'}`);
        setLoading(false);
      });

      paymentObject.open();
    } catch (err: any) {
      console.error('Checkout error:', err);
      toast.error('An unexpected error occurred during checkout.');
      setLoading(false);
    }
  };

  if (isCurrentPlan) {
    return (
      <button
        disabled
        className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-default ${className}`}
      >
        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        Current Active Plan
      </button>
    );
  }

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all duration-200 shadow-lg cursor-pointer ${
        planTier === 'PRO_ANNUAL'
          ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-extrabold shadow-amber-500/20'
          : 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700/80 hover:border-zinc-600'
      } ${loading ? 'opacity-70 cursor-not-allowed' : ''} ${className}`}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-current" />
          <span>Processing Checkout...</span>
        </>
      ) : (
        <>
          <Zap className="w-4 h-4 fill-current shrink-0" />
          <span>Upgrade to {planTitle} ({amountText})</span>
        </>
      )}
    </button>
  );
}
