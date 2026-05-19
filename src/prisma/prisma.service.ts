// import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
// import { PrismaClient } from '../../prisma/generated';

// @Injectable()
// export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
//   private readonly logger = new Logger(PrismaService.name);

//   async onModuleInit() {
//     this.logger.log('Connecting to database');
//     await this.$connect();
//     this.logger.log('Database connection established');
//   }

//   async onModuleDestroy() {
//     this.logger.log('Disconnecting from database');
//     await this.$disconnect();
//     this.logger.log('Database disconnected');
//   }
// }

import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private readonly prisma: PrismaClient;
  private readonly connectionString: string;

  constructor(private readonly configService: ConfigService) {
    const connectionString = configService.getOrThrow<string>(
      'DATABASE_URL',
    );

    const adapter = new PrismaPg({ connectionString });

    super({
      adapter,
      log: [{ emit: 'event', level: 'error' }],
    });

    this.connectionString = connectionString;

    this.prisma = new PrismaClient({
      adapter,
      log: [{ emit: 'event', level: 'error' }],
    });
  }

  async onModuleInit() {
    this.logger.log('[INIT] Prisma connecting...');
    await this.prisma.$connect();
    this.logger.log('[INIT] Prisma connected');
  }

  async onModuleDestroy() {
    this.logger.log('[DESTROY] Prisma disconnecting...');
    await this.prisma.$disconnect();
    this.logger.log('[DESTROY] Prisma disconnected');
  }

  get client() {
    return this.prisma;
  }
}