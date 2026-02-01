import { IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  username: string;

  @IsString()
  password: string;
}

export class SignupDto {
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username: string;

  @IsString()
  @MinLength(6)
  password: string;
}

export class LoginResponseDto {
  token: string
  user: {
    id: string;
    username: string;
  }
}
