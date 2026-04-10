import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import * as fs from 'fs/promises';
import pdfParse from 'pdf-parse';

@Injectable()
export class CvService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('cv-analysis') private readonly cvAnalysisQueue: Queue,
  ) {}

  async upload(
    userId: string,
    file: Express.Multer.File,
    careerId?: string,
  ) {
    // Extract text from PDF
    const pdfBuffer = await fs.readFile(file.path);
    const pdfData = await pdfParse(pdfBuffer);
    const rawText = pdfData.text;

    if (!rawText || rawText.trim().length === 0) {
      await fs.unlink(file.path);
      throw new BadRequestException('Could not extract text from PDF');
    }

    // Create CV upload record
    const cvUpload = await this.prisma.cvUpload.create({
      data: {
        userId,
        fileName: file.originalname,
        filePath: file.path,
        rawText,
      },
    });

    // Create analysis record
    const analysis = await this.prisma.cvAnalysis.create({
      data: {
        cvUploadId: cvUpload.id,
        targetCareerId: careerId,
        status: 'PENDING',
      },
    });

    // Enqueue analysis job
    await this.cvAnalysisQueue.add('analyze-cv', {
      analysisId: analysis.id,
      cvUploadId: cvUpload.id,
      careerId,
    });

    return {
      ...cvUpload,
      analysis,
    };
  }

  async getMyCvs(userId: string) {
    return this.prisma.cvUpload.findMany({
      where: { userId },
      include: {
        analysis: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getCv(id: string, userId: string) {
    const cv = await this.prisma.cvUpload.findUnique({
      where: { id },
      include: {
        analysis: true,
      },
    });

    if (!cv) {
      throw new NotFoundException('CV not found');
    }

    if (cv.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return cv;
  }

  async reanalyze(id: string, userId: string, careerId?: string) {
    const cv = await this.getCv(id, userId);

    // Upsert analysis — reset existing or create new
    const analysis = await this.prisma.cvAnalysis.upsert({
      where: { cvUploadId: cv.id },
      update: {
        status: 'PENDING',
        structuredData: Prisma.JsonNull,
        gapReport: Prisma.JsonNull,
        error: null,
        targetCareerId: careerId ?? undefined,
      },
      create: {
        cvUploadId: cv.id,
        targetCareerId: careerId,
        status: 'PENDING',
      },
    });

    // Enqueue analysis job
    await this.cvAnalysisQueue.add('analyze-cv', {
      analysisId: analysis.id,
      cvUploadId: cv.id,
      careerId,
    });

    return analysis;
  }

  async delete(id: string, userId: string) {
    const cv = await this.getCv(id, userId);

    // Delete file
    try {
      await fs.unlink(cv.filePath);
    } catch (error) {
      // File might not exist, continue with DB deletion
    }

    // Delete from DB (cascade will delete analysis)
    await this.prisma.cvUpload.delete({
      where: { id },
    });

    return { success: true };
  }
}
