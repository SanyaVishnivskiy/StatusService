import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type GroupDocument = HydratedDocument<Group>;

@Schema({ timestamps: true })
export class Group {
  id: string;

  @Prop({ required: true, trim: true, maxlength: 100 })
  name: string;

  // sha256(joinKey) used for fast lookup
  @Prop({ required: true, index: true })
  joinKeyId: string;

  // bcrypt(joinKey) used for secure verification
  @Prop({ required: true })
  joinKeyHash: string;
}

export const GroupSchema = SchemaFactory.createForClass(Group);
