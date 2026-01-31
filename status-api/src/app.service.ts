import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ServerConfig } from './config/config';
import { AppData, AppDataDocument } from './app.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class AppService {
  private serverConfig: ServerConfig;

  constructor(
    private readonly configService: ConfigService,
     @InjectModel(AppData.name)
    private readonly appDataModel: Model<AppDataDocument>,
  ) {
    this.serverConfig = this.configService.getOrThrow<ServerConfig>('server');
  }

  getHello(): string {
    return 'Hello World!';
  }

  getInfo(): ServerConfig {
    return this.serverConfig;
  }

  async getData(): Promise<AppData[]> {
    const list = await this.appDataModel.find().lean().exec();
    return list.map((item) => ({ id: item._id.toString(), key: item.key, value: item.value }));
  }

  async getDataByKey(key: string): Promise<AppData> {
    const data = await this.appDataModel.findOne({ key }).lean().exec();
    if (!data) {
      throw new NotFoundException(`Data with key '${key}' not found`);
    }

    return { id: data._id.toString(), key: data.key, value: data.value };
  }

  async setValue(key: string, value: string): Promise<string> {
    var result = await this.appDataModel
      .findOneAndUpdate(
        { key },
        { $set: { value } },
        { upsert: true, new: true },
      )
      .lean()
      .exec();

    return result._id.toString();
  }
}
