import { Controller, Get, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { StatusesService } from './statuses.service';
import type { UpdateStatusDto } from './statuses.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { MembershipGuard } from '../../common/guards/membership.guard';
import { UsersService } from '../users/users.service';

@Controller('groups/:groupId/statuses')
export class StatusesController {
  constructor(
    private statusesService: StatusesService,
    private usersService: UsersService,
  ) {}

  @Get()
  @UseGuards(AuthGuard, MembershipGuard)
  async getGroupStatuses(@Param('groupId') groupId: string) {
    return this.statusesService.getGroupStatuses(groupId);
  }

  @Put('me')
  @UseGuards(AuthGuard, MembershipGuard)
  async updateMyStatus(
    @Param('groupId') groupId: string,
    @Body() dto: UpdateStatusDto,
    @Request() req: any,
  ) {
    return this.usersService.updateUserStatus(req.user._id.toString(), groupId, dto);
  }
}

