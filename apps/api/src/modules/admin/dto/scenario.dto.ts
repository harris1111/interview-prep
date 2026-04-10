import { IsString, IsNotEmpty, IsOptional, IsUUID, IsArray, ValidateNested, IsInt, Min, IsEnum } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { Difficulty } from '@prisma/client';

export class CreateRoundDto {
  @IsInt()
  @Min(1)
  @Type(() => Number)
  roundNumber!: number;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  durationMinutes?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  questionCount?: number;

  @IsEnum(Difficulty)
  @IsOptional()
  difficulty?: Difficulty;

  @IsArray()
  @IsUUID('4', { each: true })
  topicIds!: string[];
}

export class CreateScenarioDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsUUID()
  @IsNotEmpty()
  careerId!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRoundDto)
  rounds!: CreateRoundDto[];
}

export class UpdateScenarioDto extends PartialType(CreateScenarioDto) {}
