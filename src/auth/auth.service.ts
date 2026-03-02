import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { UserDto } from '../dto/users';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '../redis/redis.service';
import { TokenPair } from '../interfaces';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
  ) {}

  async signIn(username: string, pass: string): Promise<TokenPair> {
    const user: UserDto = await this.usersService.findOneBy(
      'username',
      username,
    );

    const isMatch: boolean = await bcrypt.compare(pass, user?.password);

    if (!isMatch) {
      throw new UnauthorizedException();
    }

    return this.issueTokens(user.uuid, user.username);
  }

  async signUp(username: string, password: string): Promise<string> {
    return await this.usersService.create({ username, password });
  }

  async refresh(token: string): Promise<TokenPair> {
    const userId = await this.redisService.getUserIdByRefreshToken(token);

    if (!userId) {
      throw new UnauthorizedException();
    }

    const user: UserDto = await this.usersService.findOneBy('uuid', userId);

    await this.redisService.deleteRefreshToken(token);

    return this.issueTokens(user.uuid, user.username);
  }

  async signOut(
    refreshToken: string,
    jwtId: string,
    ttlSeconds: number,
  ): Promise<void> {
    await Promise.all([
      this.redisService.deleteRefreshToken(refreshToken),
      ttlSeconds > 0
        ? this.redisService.addToBlocklist(jwtId, ttlSeconds)
        : Promise.resolve(),
    ]);
  }

  private async issueTokens(
    userId: string,
    username: string,
  ): Promise<TokenPair> {
    const payload = { sub: userId, username, jwtId: crypto.randomUUID() };
    const accessToken = await this.jwtService.signAsync(payload);
    const refreshToken = crypto.randomBytes(32).toString('hex');

    await this.redisService.storeRefreshToken(
      refreshToken,
      userId,
      Number(process.env.JWT_REFRESH_TOKEN_TTL_SECONDS) || 604800, // 7 days
    );

    return { accessToken, refreshToken };
  }
}
