import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';

export interface UpdateStatusDto {
  state: 'NOT_AVAILABLE' | 'AVAILABLE' | 'READY' | 'DONT_WANT';
  gameIds?: string[];
  message?: string;
}

@Injectable()
export class StatusesService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async getGroupStatuses(groupId: string) {
    const groupObjectId = new Types.ObjectId(groupId);
    const users = await this.userModel.find({ 'groups.groupId': groupObjectId }).exec();

    const statuses: any[] = [];
    for (const user of users) {
      const group = user.groups.find((g) => g.groupId.equals(groupObjectId));
      if (group?.data?.status) {
        statuses.push({
          user: {
            id: user._id.toString(),
            username: user.username,
          },
          state: group.data.status.state,
          gameIds: group.data.status.gameIds?.map((id) => id.toString()) || [],
          message: group.data.status.message,
          updatedAt: group.data.status.updatedAt,
        });
      }
    }

    return statuses;
  }
}

