import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const [
      totalUsers,
      totalSessions,
      totalQuestions,
      totalCareers,
      totalTopics,
      completedSessions,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.interviewSession.count(),
      this.prisma.question.count({ where: { isActive: true } }),
      this.prisma.career.count({ where: { isActive: true } }),
      this.prisma.topic.count(),
      this.prisma.interviewSession.findMany({
        where: {
          status: 'COMPLETED',
          overallScore: { not: null },
        },
        select: {
          overallScore: true,
        },
      }),
    ]);

    const avgScore =
      completedSessions.length > 0
        ? completedSessions.reduce((sum, s) => sum + (s.overallScore || 0), 0) /
          completedSessions.length
        : 0;

    return {
      totalUsers,
      totalSessions,
      totalQuestions,
      avgScore: Math.round(avgScore * 100) / 100,
      totalCareers,
      totalTopics,
    };
  }
}
