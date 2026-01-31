import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Group, GroupDocument } from './schemas/group.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { createHash } from 'crypto';
import { CreateGroupDto, JoinGroupDto } from './dtos/group.dto';
import * as bcrypt from 'bcrypt';
import { dbConstants } from 'src/common/db/constants';

@Injectable()
export class GroupsService {
  private readonly logger = new Logger(GroupsService.name);
  private readonly saltRounds = 10;

  constructor(
    @InjectModel(Group.name) private readonly groupModel: Model<GroupDocument>,
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
