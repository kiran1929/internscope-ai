import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { UserRepository } from '@/lib/repositories/user';
import { verifyRazorpaySignature } from '@/lib/razorpay';
import { PlanTier } from '@/lib/generated/prisma/client';

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
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing required Razorpay payment verification parameters.' },
        { status: 400 }
      );
    }

    // Verify HMAC SHA256 Signature
    const isValid = verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      console.warn(`[Razorpay Payment Verification Failed] Order: ${razorpay_order_id}, Payment: ${razorpay_payment_id}`);
      
      // Update PaymentOrder record to FAILED
      await prisma.paymentOrder.updateMany({
        where: { razorpayOrderId: razorpay_order_id },
        data: { status: 'FAILED' },
      });

      return NextResponse.json(
        { error: 'Invalid payment signature verification.' },
        { status: 400 }
      );
    }

    // Fetch existing payment order
    const paymentOrder = await prisma.paymentOrder.findUnique({
      where: { razorpayOrderId: razorpay_order_id },
    });

    if (!paymentOrder) {
      return NextResponse.json(
        { error: 'Payment order record not found in database.' },
        { status: 404 }
      );
    }

    // Update payment order status to SUCCESS
    await prisma.paymentOrder.update({
      where: { razorpayOrderId: razorpay_order_id },
      data: {
        status: 'SUCCESS',
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
      },
    });

    // Calculate plan expiration
    const now = new Date();
    const expiresAt = new Date(now);

    if (paymentOrder.planTier === PlanTier.PRO_ANNUAL) {
      expiresAt.setDate(expiresAt.getDate() + 365);
    } else {
      expiresAt.setDate(expiresAt.getDate() + 30);
    }

    // Upgrade User plan in database
    const updatedUser = await prisma.user.update({
      where: { id: paymentOrder.userId },
      data: {
        planTier: paymentOrder.planTier,
        planExpiresAt: expiresAt,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully! Your account has been upgraded.',
      planTier: updatedUser.planTier,
      expiresAt: updatedUser.planExpiresAt,
    });
  } catch (err: any) {
    console.error('[Razorpay Verify Payment Error]:', err);
    return NextResponse.json(
      { error: err.message || 'Payment verification failed.' },
      { status: 500 }
    );
  }
}
