import { Body, Controller, Get, Param, Post, UseGuards, Request } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { CreateGroupDto, JoinGroupDto } from './dtos/group.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { MembershipGuard } from '../../common/guards/membership.guard';

@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  async create(@Body() dto: CreateGroupDto) {
    return this.groupsService.createGroup(dto);
  }

  @Get()
  @UseGuards(AuthGuard)
  async getAll() {
    return this.groupsService.getAllGroups();
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async getMyGroups(@Request() req: any) {
    return this.groupsService.getUserGroups(req.user._id.toString());
  }

  @Post(':groupId/join')
  @UseGuards(AuthGuard)
  async join(@Param('groupId') groupId: string, @Body() dto: JoinGroupDto, @Request() req: any) {
    return this.groupsService.joinGroupAsUser(groupId, dto.joinKey, req.user._id.toString());
  }
}

