import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class UpdateSettingsDto {
  @IsString()
  @IsOptional()
  llmBaseUrl?: string;

  @IsString()
  @IsOptional()
  llmApiKey?: string;

  @IsString()
  @IsOptional()
  llmModel?: string;

  @IsNumber()
  @Min(0)
  @Max(2)
  @IsOptional()
  llmTemperature?: number;

  @IsString()
  @IsOptional()
  systemPrompt?: string;
}
