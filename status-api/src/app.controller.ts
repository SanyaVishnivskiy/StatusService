import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AppService } from './app.service';
import type { ServerConfig } from './config/config';
import { get } from 'http';
import { App } from 'supertest/types';
import { AppData } from './app.schema';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('info')
  getStatus(): ServerConfig {
    return this.appService.getInfo();
  }

  @Get('data')
  async getData(): Promise<AppData[]> {
    return await this.appService.getData();
  }

  @Get('data/:key')
  async getDataByKey(@Param('key') key: string): Promise<AppData | null> {
    return await this.appService.getDataByKey(key);
  }

  @Post('data')
  async postData(@Body() body: any): Promise<{ id: string }> {
    const id = await this.appService.setValue(body.key, body.value);
    return { id };
  }
}
