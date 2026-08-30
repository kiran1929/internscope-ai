'use server';

import { revalidatePath } from 'next/cache';
import { currentUser } from '@clerk/nextjs/server';
import { UserRepository } from '@/lib/repositories/user';
import { NotificationRepository } from '@/lib/repositories/notification';

async function getAdminUser() {
  const clerkUser = await currentUser();
  if (!clerkUser) throw new Error('Unauthorized');
  const dbUser = await UserRepository.findByClerkId(clerkUser.id);
  if (!dbUser) throw new Error('User record not found');
  return dbUser;
}

export async function markNotificationReadAction(id: string) {
  try {
    const dbUser = await getAdminUser();
    const notification = await NotificationRepository.markAsRead(id, dbUser.id);
    revalidatePath('/admin/notifications');
    return { success: true, data: notification };
  } catch (error: unknown) {
    console.error('Failed to mark notification as read:', error);
    const message = error instanceof Error ? error.message : 'Failed to update notification';
    return { success: false, error: message };
  }
}

export async function markAllNotificationsReadAction() {
  try {
    const dbUser = await getAdminUser();
    await NotificationRepository.markAllAsRead(dbUser.id);
    revalidatePath('/admin/notifications');
    return { success: true };
  } catch (error: unknown) {
    console.error('Failed to mark all notifications as read:', error);
    const message = error instanceof Error ? error.message : 'Failed to update notifications';
    return { success: false, error: message };
  }
}

export async function deleteNotificationAction(id: string) {
  try {
    const dbUser = await getAdminUser();
    await NotificationRepository.delete(id, dbUser.id);
    revalidatePath('/admin/notifications');
    return { success: true };
  } catch (error: unknown) {
    console.error('Failed to delete notification:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete notification';
    return { success: false, error: message };
  }
}

export async function getMyNotificationsAction() {
  try {
    const dbUser = await getAdminUser();
    const res = await NotificationRepository.findManyByUser(dbUser.id, { limit: 10 });
    return { success: true, notifications: res.data };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch notifications';
    return { success: false, error: message };
  }
}
