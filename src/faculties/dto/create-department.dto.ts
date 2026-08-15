import { IsNotEmpty, IsString, IsOptional, IsInt } from 'class-validator';

export class CreateDepartmentDto {
  @IsNotEmpty({ message: 'Department name is required' })
  @IsString()
  name: string;

  @IsNotEmpty({ message: 'Faculty ID is required' })
  @IsInt()
  facultyId: number;
}

export class UpdateDepartmentDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  facultyId?: number;
}
