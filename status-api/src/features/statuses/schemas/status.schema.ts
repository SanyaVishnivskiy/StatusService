import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Types } from 'mongoose';

export type StatusDocument = HydratedDocument<Status>;

@Schema({ timestamps: true })
export class Status {
  @Prop({ required: true })
  groupId: Types.ObjectId;

  @Prop({ required: true })
  userId: Types.ObjectId;

  @Prop({ enum: ['NOT_AVAILABLE', 'AVAILABLE', 'READY', 'DONT_WANT'], default: 'NOT_AVAILABLE' })
  state: string;

  @Prop({ type: [Types.ObjectId], default: [] })
  gameIds: Types.ObjectId[];

  @Prop({ type: String, default: null })
  message: string | null;
}

export const StatusSchema = SchemaFactory.createForClass(Status);

// Create unique compound index on groupId + userId
StatusSchema.index({ groupId: 1, userId: 1 }, { unique: true });
