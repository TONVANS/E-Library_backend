import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateFacultyDto {
  @IsNotEmpty({ message: 'Faculty name is required' })
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  code?: string;
}

export class UpdateFacultyDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  code?: string;
}
