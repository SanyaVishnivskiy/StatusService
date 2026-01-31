import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema({ collection: 'app_data' })
export class AppData {
  id: string;
  @Prop({ required: true })
  key: string;
  @Prop({ required: true })
  value: string;
}

export type AppDataDocument = AppData & Document;
export const AppDataSchema = SchemaFactory.createForClass(AppData);