import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsNotEmpty({ message: 'User code is required' })
  @IsString()
  userCode: string;

  @IsNotEmpty({ message: 'Password is required' })
  @IsString()
  @MinLength(4, { message: 'Password must be at least 4 characters long' })
  password: string;
}
