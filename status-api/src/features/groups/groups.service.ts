import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Group, GroupDocument } from './schemas/group.schema';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { createHash } from 'crypto';
import { CreateGroupDto, JoinGroupDto } from './dtos/group.dto';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../users/schemas/user.schema';
import { dbConstants } from 'src/common/db/constants';

@Injectable()
export class GroupsService {
  private readonly logger = new Logger(GroupsService.name);
  private readonly saltRounds = 10;

  constructor(
    @InjectModel(Group.name) private readonly groupModel: Model<GroupDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async createGroup(dto: CreateGroupDto) {
    const joinKeyId = this.toJoinKeyId(dto.joinKey);
    const joinKeyHash = await bcrypt.hash(dto.joinKey, this.saltRounds);

    const created = await this.groupModel.create({
      name: dto.name,
      joinKeyId,
      joinKeyHash,
    });

    return {
      id: created._id.toString(),
      name: created.name,
      createdAt: (created as any).createdAt,
      updatedAt: (created as any).updatedAt,
    };
  }

  async getAllGroups() {
    const groups = await this.groupModel.find().exec();
    return groups.map((g) => ({
      _id: g._id.toString(),
      name: g.name,
      joinKeyHash: g.joinKeyHash,
      createdAt: (g as any).createdAt,
      updatedAt: (g as any).updatedAt,
    }));
  }

  async getUserGroups(userId: string) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new NotFoundException('User not found');

    const groupIds = user.groups.map((g) => g.groupId);
    const groups = await this.groupModel
      .find({ _id: { $in: groupIds } })
      .exec();

    return groups.map((g) => ({
      _id: g._id.toString(),
      name: g.name,
      joinKeyHash: g.joinKeyHash,
      createdAt: (g as any).createdAt,
      updatedAt: (g as any).updatedAt,
    }));
  }

  async joinGroup(dto: JoinGroupDto) {
    const joinKeyId = this.toJoinKeyId(dto.joinKey);

    const group = await this.groupModel.findOne({ joinKeyId }).exec();
    if (!group)
      throw new NotFoundException('Group not found.');

    const ok = await bcrypt.compare(dto.joinKey, group.joinKeyHash);
    if (!ok)
      throw new BadRequestException('Invalid join key.');

    return {
      id: group._id.toString(),
      name: group.name,
    };
  }

  async joinGroupAsUser(groupId: string, joinKey: string, userId: string) {
    const group = await this.groupModel.findById(groupId).exec();
    if (!group) throw new NotFoundException('Group not found');

    const ok = await bcrypt.compare(joinKey, group.joinKeyHash);
    if (!ok) throw new BadRequestException('Invalid join key');

    const groupObjectId = new Types.ObjectId(groupId);
    const user = await this.userModel.findById(userId);
    if (user && !user.groups.some((g) => g.groupId.equals(groupObjectId))) {
      user.groups.push({
        groupId: groupObjectId,
        data: {
          status: {
            state: 'NOT_AVAILABLE',
            gameIds: [],
            message: null,
            updatedAt: new Date(),
          },
        },
      } as any);
      await user.save();
    }

    return {
      _id: group._id.toString(),
      name: group.name,
      joinKeyHash: group.joinKeyHash,
      createdAt: (group as any).createdAt,
      updatedAt: (group as any).updatedAt,
    };
  }

  async rotateJoinKey(groupId: string, newJoinKey: string) {
    const joinKeyId = this.toJoinKeyId(newJoinKey);
    const joinKeyHash = await bcrypt.hash(newJoinKey, this.saltRounds);

    const updated = await this.groupModel
      .findByIdAndUpdate(
        groupId,
        { joinKeyId, joinKeyHash },
        { new: true },
      )
      .exec();

    if (!updated)
      throw new NotFoundException('Group not found.');

    return { id: updated._id.toString(), name: updated.name };
  }

  async ensureDefaultGroup(name: string, joinKey: string) {
    if (!name || !joinKey) return;

    const joinKeyId = this.toJoinKeyId(joinKey);

    // Prefer stable lookup by joinKeyId (fast + indexed)
    const existing = await this.groupModel.findOne({ joinKeyId }).exec();
    if (existing) {
      this.logger.log(`Default group already exists: ${existing.name} (${existing._id})`);
      return existing;
    }

    const joinKeyHash = await bcrypt.hash(joinKey, this.saltRounds);

    const created = await this.groupModel.create({
      name,
      joinKeyId,
      joinKeyHash,
    });

    this.logger.log(`Default group created: ${created.name} (${created._id})`);
    return created;
  }

  private toJoinKeyId(joinKey: string): string {
    return createHash('sha256').update(joinKey, 'utf8').digest('hex');
  }
}
