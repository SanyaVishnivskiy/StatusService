import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { SignupDto } from './dtos/signup.dto';
import { LoginDto } from './dtos/login.dto';
import { AuthConfig } from 'src/config/config';

@Injectable()
export class UsersService {
  private readonly tokenEncryptionKey: Buffer;

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private configService: ConfigService,
  ) {
    const authConfig = this.configService.getOrThrow<AuthConfig>('auth');
    this.tokenEncryptionKey = Buffer.from(authConfig.tokenEncryptionKey, 'hex');
  }

  async signup(signupDto: SignupDto): Promise<{ token: string; user: { id: string; username: string } }> {
    const { username, password } = signupDto;

    const usernameLower = username.toLowerCase();
    const existingUser = await this.userModel.findOne({ usernameLower });
    if (existingUser) {
      throw new BadRequestException('Username already taken');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const rawToken = this.generateToken();
    const tokenCiphertext = this.encryptToken(rawToken);

    const user = await this.userModel.create({
      username,
      usernameLower,
      passwordHash,
      tokenCiphertext,
      groups: [],
      lastSeenAt: new Date(),
    });

    return {
      token: rawToken,
      user: {
        id: user._id.toString(),
        username: user.username,
      },
    };
  }

  async login(loginDto: LoginDto): Promise<{ token: string; user: { id: string; username: string } }> {
    const { username, password } = loginDto;

    const usernameLower = username.toLowerCase();
    const user = await this.userModel.findOne({ usernameLower });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const rawToken = this.decryptToken(user.tokenCiphertext);

    await this.updateLastSeen(user._id.toString());

    return {
      token: rawToken,
      user: {
        id: user._id.toString(),
        username: user.username,
      },
    };
  }

  async logout(userId: string): Promise<{ ok: boolean }> {
    const newRawToken = this.generateToken();
    const newTokenCiphertext = this.encryptToken(newRawToken);

    await this.userModel.updateOne(
      { _id: userId },
      {
        tokenCiphertext: newTokenCiphertext,
      },
    );

    return { ok: true };
  }

  async findByToken(token: string): Promise<UserDocument | null> {
    const users = await this.userModel.find({});
    for (const user of users) {
      try {
        const decrypted = this.decryptToken(user.tokenCiphertext);
        if (decrypted === token) {
          return user;
        }
      } catch {
        // Skip if decryption fails
      }
    }
    return null;
  }

  async updateLastSeen(userId: string): Promise<void> {
    await this.userModel.updateOne({ _id: userId }, { lastSeenAt: new Date() });
  }

  async addToGroup(userId: string, groupId: string): Promise<void> {
    const groupObjectId = new Types.ObjectId(groupId);
    
    // Check if user is already in group
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
  }

  async getGroupUsers(groupId: string): Promise<any[]> {
    const groupObjectId = new Types.ObjectId(groupId);
    const users = await this.userModel.find({ 'groups.groupId': groupObjectId }).exec();
    return users.map((user) => ({
      _id: user._id.toString(),
      username: user.username,
      usernameLower: user.usernameLower,
      groups: user.groups.map((g) => ({
        groupId: g.groupId.toString(),
        data: {
          status: {
            state: g.data?.status?.state || 'NOT_AVAILABLE',
            gameIds: g.data?.status?.gameIds?.map((id) => id.toString()) || [],
            message: g.data?.status?.message || null,
            updatedAt: g.data?.status?.updatedAt,
          },
        },
      })),
      lastSeenAt: user.lastSeenAt,
      createdAt: (user as any).createdAt,
      updatedAt: (user as any).updatedAt,
    }));
  }

  async getUserGroupIds(userId: string): Promise<string[]> {
    const user = await this.userModel.findById(userId);
    if (!user) return [];
    return user.groups.map((g) => g.groupId.toString());
  }

  async updateUserStatus(
    userId: string,
    groupId: string,
    status: { state: string; gameIds?: string[]; message?: string },
  ): Promise<any> {
    const groupObjectId = new Types.ObjectId(groupId);
    const gameIds = status.state === 'READY' ? status.gameIds?.map((id) => new Types.ObjectId(id)) || [] : [];

    const user = await this.userModel.findOneAndUpdate(
      { _id: userId, 'groups.groupId': groupObjectId },
      {
        $set: {
          'groups.$.data.status': {
            state: status.state,
            gameIds,
            message: status.message || null,
            updatedAt: new Date(),
          },
        },
      },
      { new: true },
    );

    if (!user) throw new Error('User or group not found');

    const groupData = user.groups.find((g) => g.groupId.equals(groupObjectId));
    return {
      groupId,
      userId,
      state: groupData?.data?.status?.state,
      gameIds: groupData?.data?.status?.gameIds?.map((id) => id.toString()) || [],
      message: groupData?.data?.status?.message,
      updatedAt: groupData?.data?.status?.updatedAt,
    };
  }

  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private encryptToken(token: string): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.tokenEncryptionKey, iv);
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  private decryptToken(ciphertext: string): string {
    const parts = ciphertext.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const decipher = crypto.createDecipheriv('aes-256-gcm', this.tokenEncryptionKey, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}

