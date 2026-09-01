import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { UserRepository } from '@/lib/repositories/user';
import { getRazorpayInstance } from '@/lib/razorpay';
import { PlanTier } from '@/lib/generated/prisma/client';

const PLAN_PRICES: Record<string, { amountInPaise: number; planTier: PlanTier }> = {
  PRO_MONTHLY: {
    amountInPaise: 49900, // ₹499 INR
    planTier: PlanTier.PRO_MONTHLY,
  },
  PRO_ANNUAL: {
    amountInPaise: 399900, // ₹3,999 INR
    planTier: PlanTier.PRO_ANNUAL,
  },
};

export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const dbUser = await UserRepository.findByClerkId(clerkId);
    if (!dbUser) {
      return NextResponse.json({ error: 'User record not found.' }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const { planTier } = body;

    if (!planTier || !PLAN_PRICES[planTier]) {
      return NextResponse.json(
        { error: 'Invalid or missing planTier. Allowed options: PRO_MONTHLY, PRO_ANNUAL' },
        { status: 400 }
      );
    }

    const selectedPlan = PLAN_PRICES[planTier];
    const razorpay = getRazorpayInstance();

    const receiptId = `rcpt_${dbUser.id.substring(0, 8)}_${Date.now()}`;

    const orderOptions = {
      amount: selectedPlan.amountInPaise,
      currency: 'INR',
      receipt: receiptId,
      notes: {
        userId: dbUser.id,
        clerkId: dbUser.clerkId,
        userEmail: dbUser.email,
        planTier: selectedPlan.planTier,
      },
    };

    const razorpayOrder = await razorpay.orders.create(orderOptions);

    // Save pending PaymentOrder in database
    await prisma.paymentOrder.create({
      data: {
        userId: dbUser.id,
        razorpayOrderId: razorpayOrder.id,
        amount: selectedPlan.amountInPaise,
        currency: 'INR',
        status: 'PENDING',
        planTier: selectedPlan.planTier,
      },
    });

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;

    return NextResponse.json({
      success: true,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId,
      planTier: selectedPlan.planTier,
      user: {
        name: dbUser.profile ? `${dbUser.profile.firstName || ''} ${dbUser.profile.lastName || ''}`.trim() : undefined,
        email: dbUser.email,
      },
    });
  } catch (err: any) {
    console.error('[Razorpay Create Order Error]:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to create Razorpay payment order.' },
      { status: 500 }
    );
  }
}
