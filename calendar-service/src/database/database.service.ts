import { Inject, Injectable } from '@nestjs/common';

import { type Database, DATABASE_CLIENT } from './database.provider';

@Injectable()
export class DatabaseService {
  constructor(@Inject(DATABASE_CLIENT) public readonly db: Database) {}
}
