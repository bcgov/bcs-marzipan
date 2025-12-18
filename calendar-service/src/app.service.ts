import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { sql } from 'drizzle-orm';

import { type Database, DATABASE_CLIENT } from './database/database.provider';

@Injectable()
export class AppService {
  constructor(@Inject(DATABASE_CLIENT) private readonly db: Database) {}

  getHealth() {
    return {
      status: 'ok',
      uptime: process.uptime(),
    };
  }

  async getReadiness(): Promise<{ ready: boolean; database?: string }> {
    try {
      // Check database connectivity with a simple query
      await this.db.execute(sql`SELECT 1`);
      return {
        ready: true,
        database: 'connected',
      };
    } catch {
      return {
        ready: false,
        database: 'disconnected',
      };
    }
  }
}
