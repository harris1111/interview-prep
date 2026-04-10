import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CvController } from './cv.controller';
import { CvService } from './cv.service';
import { CvAnalysisProcessor } from './cv-analysis.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'cv-analysis',
    }),
  ],
  controllers: [CvController],
  providers: [CvService, CvAnalysisProcessor],
  exports: [CvService],
})
export class CvModule {}
