import { IsNotEmpty, IsString, IsOptional, IsInt } from 'class-validator';

export class CreateDepartmentDto {
  @IsNotEmpty({ message: 'Department name is required' })
  @IsString()
  name: string;
  // facultyId comes from the route (POST /faculties/:id/departments), not the body
}

export class UpdateDepartmentDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  facultyId?: number;
}
