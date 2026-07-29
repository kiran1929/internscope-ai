import { prisma } from '../db';
import { NotificationType } from '../generated/prisma/client';
import { getPaginationOptions, buildPaginatedResult, PaginationParams } from '../db-utils';

export interface NotificationFilterParams extends PaginationParams {
  isRead?: boolean;
}

export class NotificationRepository {
  static async findManyByUser(userId: string, params?: NotificationFilterParams) {
    const { page, limit, skip, take } = getPaginationOptions(params);

    const where = {
      userId,
      ...(params?.isRead !== undefined && { isRead: params.isRead }),
    };

    const [data, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
    ]);

    return buildPaginatedResult(data, total, page, limit);
  }

  static async create(data: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
  }) {
    return prisma.notification.create({
      data,
    });
  }

  static async markAsRead(id: string) {
    return prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  static async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  static async delete(id: string) {
    return prisma.notification.delete({
      where: { id },
    });
  }
}
