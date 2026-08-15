import { IsOptional, IsString, IsEmail, IsEnum, IsInt } from 'class-validator';
import { Role } from '@prisma/client';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsInt()
  facultyId?: number;

  @IsOptional()
  @IsInt()
  departmentId?: number;
}

export class ResetPasswordDto {
  @IsOptional()
  @IsString()
  newPassword?: string;
}
