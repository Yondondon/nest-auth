import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;

  onModuleInit() {
    this.client = new Redis({
      host: process.env.REDIS_HOST ?? 'localhost',
      port: Number(process.env.REDIS_PORT ?? 6379),
    });
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  async storeRefreshToken(
    token: string,
    userId: string,
    ttlSeconds: number,
  ): Promise<void> {
    await this.client.set(`refresh:${token}`, userId, 'EX', ttlSeconds);
  }

  async getUserIdByRefreshToken(token: string): Promise<string | null> {
    return this.client.get(`refresh:${token}`);
  }

  async deleteRefreshToken(token: string): Promise<void> {
    await this.client.del(`refresh:${token}`);
  }

  async addToBlocklist(jwtId: string, ttlSeconds: number): Promise<void> {
    await this.client.set(`blocklist:${jwtId}`, '1', 'EX', ttlSeconds);
  }

  async isBlocklisted(jwtId: string): Promise<boolean> {
    const result = await this.client.exists(`blocklist:${jwtId}`);
    return result === 1;
  }
}
