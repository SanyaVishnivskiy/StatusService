import { IsString, MinLength, MaxLength } from 'class-validator';

export class CreateGroupDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsString()
  @MinLength(8)
  @MaxLength(200)
  joinKey: string;
}

export class CreateGroupResponseDto {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export class GroupDto {
  id: string;
  name: string;
  joined: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class JoinGroupDto {
  @IsString()
  id: string;

  @IsString()
  @MinLength(8)
  @MaxLength(200)
  joinKey: string;
}
