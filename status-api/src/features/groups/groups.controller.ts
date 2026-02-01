import { Body, Controller, Get, Param, Post, UseGuards, Request, Put } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { CreateGroupDto, JoinGroupDto } from './dtos/group.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { MembershipGuard } from '../../common/guards/membership.guard';
import { CurrentUser } from 'src/common/decorators/currentUser.decorator';
import type { UserDto } from '../users/dtos/user.dto';

@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  @UseGuards(AuthGuard)
  async create(@Body() dto: CreateGroupDto) {
    return this.groupsService.createGroup(dto);
  }

  @Get()
  @UseGuards(AuthGuard)
  async getAll(@CurrentUser() user: UserDto) {
    return this.groupsService.getAllGroups(user);
  }

  @Post(':groupId/join')
  @UseGuards(AuthGuard)
  async join(
    @Param('groupId') groupId: string,
    @Body() dto: JoinGroupDto,
    @CurrentUser() user: UserDto
  ) {
    dto.id = groupId;
    await this.groupsService.joinGroup(dto, user);
    return { ok: true };
  }

  @Put(':groupId/rotate-key')
  @UseGuards(AuthGuard, MembershipGuard)
  async rotateJoinKey(
    @Param('groupId') groupId: string,
    @Body('newJoinKey') newJoinKey: string
  ) {
    await this.groupsService.rotateJoinKey(groupId, newJoinKey);
    return { ok: true };
  }
}

