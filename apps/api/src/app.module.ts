import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import configuration from './config/configuration';
import { PrismaModule } from './modules/prisma';
import { AuthModule } from './modules/auth/auth.module';
import { MailModule } from './modules/mail/mail.module';
import { AdminModule } from './modules/admin/admin.module';
import { LlmModule } from './modules/llm/llm.module';
import { CvModule } from './modules/cv/cv.module';
import { InterviewModule } from './modules/interview/interview.module';
import { KnowledgeModule } from './modules/knowledge/knowledge.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env', '../../.env'],
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get('redis.host'),
          port: configService.get('redis.port'),
        },
      }),
    }),
    PrismaModule,
    LlmModule,
    AuthModule,
    MailModule,
    AdminModule,
    CvModule,
    InterviewModule,
    KnowledgeModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
