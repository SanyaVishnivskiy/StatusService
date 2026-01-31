import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Types } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

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

  @Prop({ type: [Types.ObjectId], default: [] })
  groupIds: Types.ObjectId[];

  @Prop({ type: Date, default: null })
  lastSeenAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
