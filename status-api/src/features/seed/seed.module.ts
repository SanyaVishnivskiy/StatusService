import { Module } from '@nestjs/common';
import { SeedService } from './seed.service';
import { GroupsModule } from '../groups/groups.module';

@Module({
  imports: [GroupsModule],
  providers: [SeedService]
})
export class SeedModule {}
