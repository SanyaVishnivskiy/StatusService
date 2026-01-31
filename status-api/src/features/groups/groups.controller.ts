import { Body, Controller, Post } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { CreateGroupDto, JoinGroupDto } from './dtos/group.dto';

@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  async create(@Body() dto: CreateGroupDto) {
    return this.groupsService.createGroup(dto);
  }

  @Post('join')
  async join(@Body() dto: JoinGroupDto) {
    return this.groupsService.joinGroup(dto);
  }
}
