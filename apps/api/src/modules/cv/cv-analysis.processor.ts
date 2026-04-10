import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { LlmService } from '../llm/llm.service';
import { buildExtractionPrompt, buildGapAnalysisPrompt } from './prompts/cv-prompts';

interface AnalyzeJobData {
  analysisId: string;
  cvUploadId: string;
  careerId?: string;
}

@Processor('cv-analysis', {
  concurrency: 2,
})
export class CvAnalysisProcessor extends WorkerHost {
  private readonly logger = new Logger(CvAnalysisProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly llm: LlmService,
  ) {
    super();
  }

  async process(job: Job<AnalyzeJobData>): Promise<void> {
    const { analysisId, cvUploadId, careerId } = job.data;

    this.logger.log(`Processing CV analysis: ${analysisId}`);

    try {
      // Update status to PROCESSING
      await this.prisma.cvAnalysis.update({
        where: { id: analysisId },
        data: { status: 'PROCESSING' },
      });

      // Get CV upload
      const cvUpload = await this.prisma.cvUpload.findUnique({
        where: { id: cvUploadId },
      });

      if (!cvUpload || !cvUpload.rawText) {
        throw new Error('CV text not found');
      }

      // Step 1: Extract structured data
      this.logger.log('Extracting structured data...');
      const extractionPrompt = buildExtractionPrompt(cvUpload.rawText);
      const structuredData = await this.llm.parseJsonResponse([
        {
          role: 'system',
          content: 'You are an expert CV analyst. Extract information accurately and comprehensively.',
        },
        {
          role: 'user',
          content: extractionPrompt,
        },
      ]);

      // Step 2: Gap analysis (if career specified)
      let gapReport = null;
      if (careerId) {
        this.logger.log('Performing gap analysis...');
        
        const career = await this.prisma.career.findUnique({
          where: { id: careerId },
          include: {
            topics: {
              where: { id: { not: undefined } },
              select: { name: true },
            },
          },
        });

        if (career) {
          const topicNames = career.topics.map(t => t.name);
          const gapPrompt = buildGapAnalysisPrompt(
            structuredData,
            career.name,
            topicNames,
          );

          gapReport = await this.llm.parseJsonResponse([
            {
              role: 'system',
              content: 'You are an expert career coach. Provide honest, actionable gap analysis.',
            },
            {
              role: 'user',
              content: gapPrompt,
            },
          ]);
        }
      }

      // Update analysis with results
      await this.prisma.cvAnalysis.update({
        where: { id: analysisId },
        data: {
          status: 'COMPLETED',
          structuredData,
          gapReport,
          error: null,
        },
      });

      this.logger.log(`CV analysis completed: ${analysisId}`);
    } catch (err) {
      const error = err as Error;
      this.logger.error(`CV analysis failed: ${error.message}`, error.stack);

      // Update status to FAILED
      await this.prisma.cvAnalysis.update({
        where: { id: analysisId },
        data: {
          status: 'FAILED',
          error: error.message,
        },
      });

      throw error;
    }
  }
}
