import { IsOptional, IsString, IsInt, IsEnum, IsIn, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { DocStatus } from '@prisma/client';

// Empty query values (e.g. "?facultyId=") are treated as "not provided"
const toOptionalInt = ({ value }: { value: any }) =>
  value === '' || value === null || value === undefined ? undefined : Number(value);

export class QueryDocumentDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() || undefined : value))
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(toOptionalInt)
  @IsInt()
  categoryId?: number;

  @IsOptional()
  @Transform(toOptionalInt)
  @IsInt()
  facultyId?: number;

  @IsOptional()
  @Transform(toOptionalInt)
  @IsInt()
  departmentId?: number;

  @IsOptional()
  @Transform(toOptionalInt)
  @IsInt()
  publishedYear?: number;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() || undefined : value))
  @IsString()
  tag?: string;

  @IsOptional()
  @IsEnum(DocStatus)
  status?: DocStatus;

  @IsOptional()
  @IsIn(['createdAt', 'title', 'publishedYear'])
  sortBy?: 'createdAt' | 'title' | 'publishedYear' = 'createdAt';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
