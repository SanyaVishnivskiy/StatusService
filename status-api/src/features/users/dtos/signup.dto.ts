import { IsString, MinLength, MaxLength } from 'class-validator';

export class SignupDto {
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username: string;

  @IsString()
  @MinLength(6)
  password: string;
}
