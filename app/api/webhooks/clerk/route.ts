import { WebhookEvent } from '@clerk/backend';
import { verifyWebhook } from '@clerk/backend/webhooks';
import { NextResponse } from 'next/server';
import { UserRepository } from '@/lib/repositories/user';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SIGNING_SECRET || process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    console.warn('[Clerk Webhook] CLERK_WEBHOOK_SIGNING_SECRET is not configured');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }

  let event: WebhookEvent;
  try {
    event = await verifyWebhook(req, { signingSecret: secret });
  } catch (err) {
    console.error('[Clerk Webhook] Verification failed:', err);
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
  }

  try {
    if (event.type === 'user.created' || event.type === 'user.updated') {
      const clerkUser = event.data;
      const clerkId = clerkUser.id;
      const email = clerkUser.email_addresses?.[0]?.email_address;

      if (!email) {
        return NextResponse.json({ ok: true, skipped: 'no email' });
      }

      let dbUser = await UserRepository.findByClerkId(clerkId);

      if (!dbUser) {
        dbUser = await UserRepository.findByEmail(email);
        if (dbUser && dbUser.clerkId.startsWith('user_clerk_')) {
          dbUser = await prisma.user.update({
            where: { id: dbUser.id },
            data: { clerkId },
            include: { profile: true, emailPreference: true },
          });
        }
      }

      if (!dbUser) {
        await UserRepository.createUser({
          clerkId,
          email,
          firstName: clerkUser.first_name || undefined,
          lastName: clerkUser.last_name || undefined,
          avatarUrl: clerkUser.image_url || undefined,
        });
      } else if (dbUser.email !== email) {
        await prisma.user.update({
          where: { id: dbUser.id },
          data: clerkId !== dbUser.clerkId ? { email, clerkId } : { email },
        });
      }
    }

    if (event.type === 'user.deleted') {
      const clerkId = event.data.id;
      if (clerkId) {
        const dbUser = await UserRepository.findByClerkId(clerkId);
        if (dbUser) {
          await prisma.user.update({
            where: { id: dbUser.id },
            data: { isActive: false },
          });
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[Clerk Webhook] Handler error:', err);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
