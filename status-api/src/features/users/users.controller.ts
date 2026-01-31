import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { MembershipGuard } from '../../common/guards/membership.guard';

@Controller('groups/:groupId/users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @UseGuards(AuthGuard, MembershipGuard)
  async getGroupUsers(@Param('groupId') groupId: string) {
    return this.usersService.getGroupUsers(groupId);
  }
}
