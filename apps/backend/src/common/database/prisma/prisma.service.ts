import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from 'generated/prisma';
import { Logger } from '@nestjs/common'

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly client: PrismaClient;

  constructor() {
    this.client = new PrismaClient();
    Logger.log('✅ Prisma PaginationGuard extension initialized');
  }

  /**
   * Provides access to the extended Prisma client.
   */
  get prisma(): PrismaClient {
    return this.client;
  }

  /**
   * Establishes a database connection on module init.
   */
  async onModuleInit(): Promise<void> {
    Logger.log('Connecting to database...');
    await this.client.$connect();
    Logger.log('✅ Database connected');
  }

  /**
   * Closes the database connection on shutdown.
   */
  async onModuleDestroy(): Promise<void> {
    Logger.log('Disconnecting from database...');
    await this.client.$disconnect();
    Logger.log('🛑 Database disconnected');
  }

  /**
   * Performs a simple health check to verify database connectivity.
   */
  async healthCheck(): Promise<{
    status: 'ok' | 'error';
    message: string;
    error?: string;
  }> {
    try {
      await this.client.$queryRaw`SELECT 1`;
      return { status: 'ok', message: 'Database connection is healthy' };
    } catch (error: any) {
      Logger.error('Database health check failed', error);
      return {
        status: 'error',
        message: 'Database connection failed',
        error: error?.message || String(error),
      };
    }
  }
}
