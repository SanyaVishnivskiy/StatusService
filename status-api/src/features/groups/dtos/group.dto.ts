import { IsString, MinLength, MaxLength } from 'class-validator';

export class CreateGroupDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  // Shared secret: keep it reasonably strong
  @IsString()
  @MinLength(8)
  @MaxLength(200)
  joinKey: string;
}

export class JoinGroupDto {
  @IsString()
  @MinLength(8)
  @MaxLength(200)
  joinKey: string;
}
