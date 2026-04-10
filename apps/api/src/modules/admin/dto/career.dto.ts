import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateCareerDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateCareerDto extends PartialType(CreateCareerDto) {
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
