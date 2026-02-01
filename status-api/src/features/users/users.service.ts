import { Injectable, BadRequestException, UnauthorizedException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { LoginDto, LoginResponseDto, SignupDto } from './dtos/login.dto';
import { AuthConfig } from 'src/config/config';
import { GroupDataDto, GroupUserDto, StatusDataDto, UserDto } from './dtos/user.dto';
import { decryptToken, encryptToken, generateToken } from 'src/common/crypto/encryption.utils';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private readonly tokenEncryptionKey: Buffer;

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private configService: ConfigService,
  ) {
    const authConfig = this.configService.getOrThrow<AuthConfig>('auth');
    this.tokenEncryptionKey = Buffer.from(authConfig.tokenEncryptionKey, 'hex');
  }

  async signup(signupDto: SignupDto): Promise<LoginResponseDto> {
    const { username, password } = signupDto;

    const usernameLower = username.toLowerCase();
    const existingUser = await this.userModel.findOne({ usernameLower });
    if (existingUser) {
      throw new BadRequestException('Username already taken');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const rawToken = generateToken();
    const tokenCiphertext = encryptToken(rawToken, this.tokenEncryptionKey);

    const user = await this.userModel.create({
      username,
      usernameLower,
      passwordHash,
      tokenCiphertext,
      groups: [],
      lastSeenAt: new Date(),
    });

    return {
      token: `${user.username}:${rawToken}`,
      user: {
        id: user._id.toString(),
        username: user.username,
      },
    };
  }

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
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

    const rawToken = decryptToken(user.tokenCiphertext, this.tokenEncryptionKey);

    await this.updateLastSeen(user._id.toString());

    return {
      token: `${user.username}:${rawToken}`,
      user: {
        id: user._id.toString(),
        username: user.username,
      },
    };
  }

  async logout(userId: string): Promise<void> {
    const newRawToken = generateToken();
    const newTokenCiphertext = encryptToken(newRawToken, this.tokenEncryptionKey);

    await this.userModel.updateOne(
      { _id: userId },
      {
        tokenCiphertext: newTokenCiphertext,
      },
    );
  }

  async tryAuthenticate(username: string, token: string): Promise<UserDto | null> {
    const user = await this.userModel.findOne({ username }).lean().exec();
    if (!user)
      return null;

    try {
      const decrypted = decryptToken(user.tokenCiphertext, this.tokenEncryptionKey);
      if (!decrypted) {
        this.logger.warn(`Failed to decrypt token for user ${username}`);
        return null;
      }

      if (decrypted !== token) {
        this.logger.warn(`Token mismatch for user ${username}`);
        return null;
      }

      await this.updateLastSeen(user._id.toString());
      return this.mapToUserDto(user);
    } catch (error) {
      this.logger.warn(`Failed to decrypt token for user ${username}: ${error.message}`);
    }

    return null;
  }

  async updateLastSeen(userId: string): Promise<void> {
    await this.userModel.updateOne({ _id: userId }, { lastSeenAt: new Date() });
  }

  async getGroupUsers(groupId: string): Promise<GroupUserDto[]> {
    const users = await this.userModel
      .find({ 'groups.groupId': new Types.ObjectId(groupId) })
      .lean()
      .exec();

    return users
      .map((user) => this.mapToUserDto(user))
      .map((user) => ({
        ...user,
        data: user.groups
          .filter((g) => g.groupId === groupId)
          .map((g) => g.data)[0],
    }));
  }

  async updateUserStatus(
    user: UserDto,
    groupId: string,
    data: GroupDataDto,
  ): Promise<void> {
    const groupObjectId = new Types.ObjectId(groupId);

    await this.userModel.findOneAndUpdate(
      { _id: user.id, 'groups.groupId': groupObjectId },
      {
        $set: {
          'groups.$.data': data,
        },
      },
      { new: true },
    );

    if (!user)
      throw new Error('User or group not found');

    await this.updateLastSeen(user.id);
  }

  private mapToUserDto(user: UserDocument): UserDto {
    return {
      id: user._id.toString(),
      username: user.username,
      lastSeenAt: user.lastSeenAt,
      groups: user.groups.map((g) => ({
        groupId: g.groupId.toString(),
        data: {
          status: g.data?.status
            ? {
                state: g.data.status.state,
                gameIds: g.data.status.gameIds?.map((id) => id.toString()) || [],
                message: g.data.status.message,
                updatedAt: g.data.status.updatedAt,
              }
            : undefined,
        },
      })),
    };
  }
}
