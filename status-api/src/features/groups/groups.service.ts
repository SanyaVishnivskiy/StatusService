import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Group, GroupDocument } from './schemas/group.schema';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateGroupDto, CreateGroupResponseDto, GroupDto, JoinGroupDto } from './dtos/group.dto';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../users/schemas/user.schema';
import { HASHING_SALT_ROUNDS } from 'src/common/crypto/hashing.utils';
import { UserDto } from '../users/dtos/user.dto';

@Injectable()
export class GroupsService {
  private readonly logger = new Logger(GroupsService.name);

  constructor(
    @InjectModel(Group.name) private readonly groupModel: Model<GroupDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async createGroup(dto: CreateGroupDto): Promise<CreateGroupResponseDto> {
    const joinKeyHash = await bcrypt.hash(dto.joinKey, HASHING_SALT_ROUNDS);

    const created = await this.groupModel.create({
      name: dto.name,
      joinKeyHash,
    });

    return {
      id: created._id.toString(),
      name: created.name,
      createdAt: (created as any).createdAt,
      updatedAt: (created as any).updatedAt,
    };
  }

  async getAllGroups(user: UserDto): Promise<GroupDto[]> {
    const groups = await this.groupModel.find().lean().exec();
    const memberGroupIds = new Set(
      user.groups.map((g) => g.groupId.toString()),
    );

    return groups.map((g) => ({
      id: g._id.toString(),
      name: g.name,
      joined: memberGroupIds.has(g._id.toString()),
      createdAt: (g as any).createdAt,
      updatedAt: (g as any).updatedAt,
    }));
  }

  async joinGroup(dto: JoinGroupDto, user: UserDto): Promise<void> {
    const group = await this.groupModel.findOne({ _id: dto.id }).exec();
    if (!group)
      throw new NotFoundException('Group not found.');

    const ok = await bcrypt.compare(dto.joinKey, group.joinKeyHash);
    if (!ok)
      throw new BadRequestException('Invalid join key.');

    const groupObjectId = new Types.ObjectId(dto.id);
    const userDoc = await this.userModel.findById(user.id);
    if (userDoc && !userDoc.groups.some((g) => g.groupId.equals(groupObjectId))) {
      userDoc.groups.push({
        groupId: groupObjectId,
        data: null,
      });
      await userDoc.save();
    }
  }

  async rotateJoinKey(groupId: string, newJoinKey: string): Promise<void> {
    const joinKeyHash = await bcrypt.hash(newJoinKey, HASHING_SALT_ROUNDS);

    const updated = await this.groupModel
      .findByIdAndUpdate(
        groupId,
        { joinKeyHash },
        { new: true },
      )
      .exec();

    if (!updated)
      throw new NotFoundException('Group not found.');
  }

  async ensureDefaultGroupExists(name: string, joinKey: string) {
    if (!name || !joinKey) return;

    const existing = await this.groupModel.findOne({ name }).exec();
    if (existing) {
      this.logger.log(`Default group already exists: ${existing.name} (${existing._id})`);
      return;
    }

    const joinKeyHash = await bcrypt.hash(joinKey, HASHING_SALT_ROUNDS);

    const created = await this.groupModel.create({
      name,
      joinKeyHash,
    });

    this.logger.log(`Default group created: ${created.name} (${created._id})`);
  }
}
