import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma';

// Controllers
import { CareerController } from './controllers/career.controller';
import { TopicController } from './controllers/topic.controller';
import { QuestionController } from './controllers/question.controller';
import { ScenarioController } from './controllers/scenario.controller';
import { UserManagementController } from './controllers/user-management.controller';
import { SettingsController } from './controllers/settings.controller';
import { DashboardController } from './controllers/dashboard.controller';

// Services
import { CareerService } from './services/career.service';
import { TopicService } from './services/topic.service';
import { QuestionService } from './services/question.service';
import { ScenarioService } from './services/scenario.service';
import { UserManagementService } from './services/user-management.service';
import { SettingsService } from './services/settings.service';
import { DashboardService } from './services/dashboard.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    CareerController,
    TopicController,
    QuestionController,
    ScenarioController,
    UserManagementController,
    SettingsController,
    DashboardController,
  ],
  providers: [
    CareerService,
    TopicService,
    QuestionService,
    ScenarioService,
    UserManagementService,
    SettingsService,
    DashboardService,
  ],
})
export class AdminModule {}
