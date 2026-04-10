import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CvService } from './cv.service';
import { extname } from 'path';
import { randomUUID } from 'crypto';

@Controller('cv')
@UseGuards(JwtAuthGuard)
export class CvController {
  constructor(private readonly cvService: CvService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const userId = (_req as any).user.sub;
          const uploadPath = `uploads/cv/${userId}`;
          cb(null, uploadPath);
        },
        filename: (_req, file, cb) => {
          const uniqueName = `${randomUUID()}${extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      }),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
      fileFilter: (_req, file, cb) => {
        if (file.mimetype !== 'application/pdf') {
          return cb(new Error('Only PDF files are allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadCv(
    @CurrentUser('sub') userId: string,
    @UploadedFile() file: Express.Multer.File,
    @Query('careerId') careerId?: string,
  ) {
    return this.cvService.upload(userId, file, careerId);
  }

  @Get('my')
  async getMyCvs(@CurrentUser('sub') userId: string) {
    return this.cvService.getMyCvs(userId);
  }

  @Get(':id')
  async getCv(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.cvService.getCv(id, userId);
  }

  @Post(':id/reanalyze')
  async reanalyze(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @Query('careerId') careerId?: string,
  ) {
    return this.cvService.reanalyze(id, userId, careerId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCv(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
  ) {
    await this.cvService.delete(id, userId);
  }
}
