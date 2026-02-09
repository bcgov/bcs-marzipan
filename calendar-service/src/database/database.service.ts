import { Inject, Injectable } from '@nestjs/common';
import { DATABASE_CLIENT, type Database } from './database.provider';

@Injectable()
export class DatabaseService {
  constructor(@Inject(DATABASE_CLIENT) public readonly db: Database) {}
}
