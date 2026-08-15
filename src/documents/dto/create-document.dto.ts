import { IsNotEmpty, IsString, IsOptional, IsInt, IsArray, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { DocStatus } from '@prisma/client';

export class CreateDocumentDto {
  @IsNotEmpty({ message: 'Title is required' })
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  abstract?: string;

  @IsNotEmpty({ message: 'Author is required' })
  @IsString()
  author: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  publishedYear?: number;

  @IsOptional()
  @IsEnum(DocStatus)
  status?: DocStatus;

  @IsNotEmpty({ message: 'Category ID is required' })
  @Type(() => Number)
  @IsInt()
  categoryId: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  facultyId?: number; // Optional for Teacher (defaults to user.facultyId), required for Admin

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  departmentId?: number;

  @IsOptional()
  tags?: string[] | string;

  @IsOptional()
  @IsString()
  coverUrl?: string;

  @IsOptional()
  @IsString()
  fileUrl?: string;
}

export class UpdateDocumentDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  abstract?: string;

  @IsOptional()
  @IsString()
  author?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  publishedYear?: number;

  @IsOptional()
  @IsEnum(DocStatus)
  status?: DocStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  categoryId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  facultyId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  departmentId?: number;

  @IsOptional()
  tags?: string[] | string;

  @IsOptional()
  @IsString()
  coverUrl?: string;

  @IsOptional()
  @IsString()
  fileUrl?: string;
}

export class UpdateDocumentStatusDto {
  @IsNotEmpty()
  @IsEnum(DocStatus)
  status: DocStatus;
}
