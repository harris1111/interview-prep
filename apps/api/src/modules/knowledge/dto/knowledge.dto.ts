import { IsString, IsOptional, IsArray } from 'class-validator';

export class CreateKnowledgeEntryDto {
  @IsString()
  title!: string;

  @IsString()
  content!: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  careerId?: string;

  @IsOptional()
  @IsString()
  topicSlug?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class UpdateKnowledgeEntryDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  careerId?: string;

  @IsOptional()
  @IsString()
  topicSlug?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export interface ImportResultDto {
  filesProcessed: number;
  questionsImported: number;
  knowledgeEntriesCreated: number;
  errors: string[];
}

export class KnowledgeQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  careerId?: string;

  @IsOptional()
  @IsString()
  topicSlug?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;
}
