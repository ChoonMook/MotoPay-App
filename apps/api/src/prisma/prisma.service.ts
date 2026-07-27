// Prisma 7는 PrismaClient에 드라이버 어댑터를 명시적으로 넘겨야 함 — MariaDB는 @prisma/adapter-mariadb 사용
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@prisma/client';
import { parseDatabaseUrl } from '../common/db/mariadb-config';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      adapter: new PrismaMariaDb(
        parseDatabaseUrl(process.env.DATABASE_URL as string),
      ),
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('MariaDB 연결 완료');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
