import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Status, StatusSchema } from './schemas/status.schema';
import { StatusesService } from './statuses.service';
import { StatusesController } from './statuses.controller';
import { User, UserSchema } from '../users/schemas/user.schema';
import { UsersService } from '../users/users.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Status.name, schema: StatusSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [StatusesController],
  providers: [StatusesService, UsersService],
  exports: [StatusesService],
})
export class StatusesModule {}
