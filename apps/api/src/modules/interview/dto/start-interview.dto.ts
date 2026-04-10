import { IsString, IsOptional } from 'class-validator';

export class StartInterviewDto {
  @IsString()
  scenarioId!: string;

  @IsOptional()
  @IsString()
  cvAnalysisId?: string;
}
