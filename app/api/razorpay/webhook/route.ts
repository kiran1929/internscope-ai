import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyRazorpayWebhookSignature } from '@/lib/razorpay';
import { PlanTier } from '@/lib/generated/prisma/client';

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing x-razorpay-signature header' }, { status: 400 });
    }

    const isValid = verifyRazorpayWebhookSignature(rawBody, signature);
    if (!isValid) {
      console.warn('[Razorpay Webhook] Signature verification failed');
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
    }

    const event = JSON.parse(rawBody);

    if (event.event === 'payment.captured') {
      const paymentEntity = event.payload?.payment?.entity;
      const orderId = paymentEntity?.order_id;
      const paymentId = paymentEntity?.id;

      if (orderId) {
        const paymentOrder = await prisma.paymentOrder.findUnique({
          where: { razorpayOrderId: orderId },
        });

        if (paymentOrder && paymentOrder.status !== 'SUCCESS') {
          await prisma.paymentOrder.update({
            where: { razorpayOrderId: orderId },
            data: {
              status: 'SUCCESS',
              razorpayPaymentId: paymentId,
            },
          });

          const now = new Date();
          const expiresAt = new Date(now);

          if (paymentOrder.planTier === PlanTier.PRO_ANNUAL) {
            expiresAt.setDate(expiresAt.getDate() + 365);
          } else {
            expiresAt.setDate(expiresAt.getDate() + 30);
          }

          await prisma.user.update({
            where: { id: paymentOrder.userId },
            data: {
              planTier: paymentOrder.planTier,
              planExpiresAt: expiresAt,
            },
          });
        }
      }
    } else if (event.event === 'payment.failed') {
      const paymentEntity = event.payload?.payment?.entity;
      const orderId = paymentEntity?.order_id;

      if (orderId) {
        await prisma.paymentOrder.updateMany({
          where: { razorpayOrderId: orderId },
          data: { status: 'FAILED' },
        });
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (err: any) {
    console.error('[Razorpay Webhook Error]:', err);
    return NextResponse.json({ error: 'Webhook processing error' }, { status: 500 });
  }
}
