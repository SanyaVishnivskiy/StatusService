import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import config, { MongoDbConfig } from './config/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppData, AppDataSchema } from './app.schema';
import { GroupsModule } from './features/groups/groups.module';
import { SeedModule } from './features/seed/seed.module';
import { UsersService } from './features/users/users.service';
import { UsersModule } from './features/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.getOrThrow<MongoDbConfig>('mongoDb').url,
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([{ name: AppData.name, schema: AppDataSchema }]),
    GroupsModule,
    SeedModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService, UsersService],
})
export class AppModule {}
