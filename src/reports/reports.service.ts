import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const [
      totalDocuments,
      availableDocuments,
      totalUsers,
      totalStudents,
      totalTeachers,
      totalFaculties,
      totalViews,
      totalDownloads,
    ] = await Promise.all([
      this.prisma.document.count(),
      this.prisma.document.count({ where: { status: 'AVAILABLE' } }),
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: 'STUDENT' } }),
      this.prisma.user.count({ where: { role: 'TEACHER' } }),
      this.prisma.faculty.count(),
      this.prisma.userActivity.count({ where: { actionType: 'VIEW' } }),
      this.prisma.userActivity.count({ where: { actionType: 'DOWNLOAD' } }),
    ]);

    // Top 5 popular documents
    const popularDocuments = await this.prisma.document.findMany({
      take: 5,
      orderBy: {
        userActivities: {
          _count: 'desc',
        },
      },
      include: {
        faculty: true,
        category: true,
        _count: {
          select: { userActivities: true },
        },
      },
    });

    // Recent activity audit log
    const recentActivities = await this.prisma.userActivity.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, userCode: true, firstName: true, lastName: true, role: true } },
        document: { select: { id: true, title: true, facultyId: true } },
      },
    });

    return {
      overview: {
        totalDocuments,
        availableDocuments,
        totalUsers,
        totalStudents,
        totalTeachers,
        totalFaculties,
        totalViews,
        totalDownloads,
      },
      popularDocuments,
      recentActivities,
    };
  }

  async getActivities(params: {
    page?: number;
    limit?: number;
    actionType?: string;
    userId?: string;
    documentId?: string;
  }) {
    const page = Math.max(Number(params.page) || 1, 1);
    const limit = Math.max(Number(params.limit) || 20, 1);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.actionType) {
      where.actionType = params.actionType;
    }
    if (params.userId) {
      where.userId = params.userId;
    }
    if (params.documentId) {
      where.documentId = params.documentId;
    }

    const [total, activities] = await Promise.all([
      this.prisma.userActivity.count({ where }),
      this.prisma.userActivity.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              userCode: true,
              firstName: true,
              lastName: true,
              role: true,
              faculty: { select: { name: true } },
            },
          },
          document: {
            select: {
              id: true,
              title: true,
              author: true,
              faculty: { select: { name: true } },
            },
          },
        },
      }),
    ]);

    return {
      data: activities,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
