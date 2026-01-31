import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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
      groupIds: [],
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
    // Generate new token to rotate it
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

  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private encryptToken(token: string): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.tokenEncryptionKey, iv);
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    
    // Combine iv + authTag + encrypted
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

