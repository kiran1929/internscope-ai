import { prisma } from '../db.js';
import { Role, Prisma } from '../generated/prisma/client.js';

export class UserRepository {
  static async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        emailPreference: true,
      },
    });
  }

  static async findByClerkId(clerkId: string) {
    return prisma.user.findUnique({
      where: { clerkId },
      include: {
        profile: true,
        emailPreference: true,
      },
    });
  }

  static async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
        emailPreference: true,
      },
    });
  }

  static async createUser(data: {
    clerkId: string;
    email: string;
    role?: Role;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
  }) {
    return prisma.user.create({
      data: {
        clerkId: data.clerkId,
        email: data.email,
        role: data.role || Role.USER,
        profile: {
          create: {
            firstName: data.firstName,
            lastName: data.lastName,
            avatarUrl: data.avatarUrl,
            skills: [],
          },
        },
        emailPreference: {
          create: {
            weeklyDigest: true,
            instantAlerts: true,
            deadlineReminders: true,
          },
        },
      },
      include: {
        profile: true,
        emailPreference: true,
      },
    });
  }

  static async updateProfile(
    userId: string,
    data: Prisma.ProfileUpdateInput
  ) {
    return prisma.profile.update({
      where: { userId },
      data,
    });
  }

  static async updateEmailPreferences(
    userId: string,
    data: Prisma.EmailPreferenceUpdateInput
  ) {
    return prisma.emailPreference.update({
      where: { userId },
      data,
    });
  }

  static async deleteUser(id: string) {
    return prisma.user.delete({
      where: { id },
    });
  }
}
