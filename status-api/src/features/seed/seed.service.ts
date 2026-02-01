import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GroupsService } from '../groups/groups.service';
import { GroupsConfig } from 'src/config/config';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly groupsService: GroupsService,
  ) {}

  async onApplicationBootstrap() {
    const config = this.config.getOrThrow<GroupsConfig>('groups');

    if (!config.defaultGroupName || !config.defaultGroupJoinKey) {
      this.logger.warn('Default group seeding skipped: DEFAULT_GROUP_NAME or DEFAULT_GROUP_JOIN_KEY not set');
      throw new Error('Default group seeding configuration missing');
    }

    await this.groupsService.ensureDefaultGroupExists(
      config.defaultGroupName,
      config.defaultGroupJoinKey);
  }
}
