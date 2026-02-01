export interface StatusDataDto {
  state: string;
  gameIds: string[];
  message: string | null;
  updatedAt: Date;
}

export interface GroupDataDto {
  status: StatusDataDto | undefined;
}

export interface UserGroupDto {
  groupId: string;
  data: GroupDataDto | undefined;
}

export interface UserDto {
  id: string;
  username: string;
  lastSeenAt: Date;
  groups: UserGroupDto[];
}

export interface GroupUserDto {
  id: string;
  username: string;
  lastSeenAt: Date;
  data: GroupDataDto | undefined;
}