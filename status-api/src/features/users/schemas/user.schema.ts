import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Types } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

class GroupStatus {
  @Prop({ type: String, enum: ['NOT_AVAILABLE', 'AVAILABLE', 'READY', 'DONT_WANT'], default: 'NOT_AVAILABLE' })
  state: string;

  @Prop({ type: [Types.ObjectId], default: [] })
  gameIds: Types.ObjectId[];

  @Prop({ type: String, default: null })
  message: string | null;

  @Prop({ type: Date, default: () => new Date() })
  updatedAt: Date;
}

class GroupData {
  @Prop({ type: GroupStatus, default: () => ({}) })
  status: GroupStatus;
}

class UserGroup {
  @Prop({ required: true, type: Types.ObjectId })
  groupId: Types.ObjectId;

  @Prop({ type: GroupData, default: () => ({}) })
  data: GroupData;
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, trim: true, maxlength: 50 })
  username: string;

  @Prop({ required: true, unique: true, index: true })
  usernameLower: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ required: true })
  tokenCiphertext: string;

  @Prop({ type: [{ groupId: Types.ObjectId, data: { status: GroupStatus } }], default: [] })
  groups: UserGroup[];

  @Prop({ type: Date, default: null })
  lastSeenAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
