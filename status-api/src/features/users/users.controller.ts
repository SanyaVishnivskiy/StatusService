import { Controller, Get, Param, UseGuards, Request, Put, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { MembershipGuard } from '../../common/guards/membership.guard';
import { CurrentUser } from 'src/common/decorators/currentUser.decorator';
import type { GroupDataDto, UserDto } from './dtos/user.dto';

@Controller('groups/:groupId/users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @UseGuards(AuthGuard, MembershipGuard)
  async getGroupUsers(@Param('groupId') groupId: string) {
    return this.usersService.getGroupUsers(groupId);
  }

  @Put('status')
  @UseGuards(AuthGuard, MembershipGuard)
  async updateUserStatus(
    @Param('groupId') groupId: string,
    @CurrentUser() user: UserDto,
    @Body() data: GroupDataDto,
  ) {
    await this.usersService.updateUserStatus(user, groupId, data);
    return { ok: true };
  }

  @Put('last-seen')
  @UseGuards(AuthGuard, MembershipGuard)
  async updateLastSeen(
    @CurrentUser() user: UserDto,
  ) {
    await this.usersService.updateLastSeen(user.id);
    return { ok: true };
  }
}