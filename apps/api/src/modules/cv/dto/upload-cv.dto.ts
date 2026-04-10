import { IsOptional, IsUUID } from 'class-validator';

export class UploadCvDto {
  @IsOptional()
  @IsUUID()
  careerId?: string;
}
