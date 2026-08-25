/**
 * Schema regression guard for activity hard delete.
 * Ensures every activities.id FK is handled by ON DELETE CASCADE or an explicit
 * delete in ActivitiesService.remove().
 */
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import {
  assertActivityHardDeleteSchemaCoverage,
  fetchActivityForeignKeyDependencies,
} from '../src/activities/activity-hard-delete.coverage';
import { AppModule } from '../src/app.module';
import { DatabaseService } from '../src/database/database.service';

describe('Activity hard delete schema coverage (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('requires CASCADE or explicit delete for every activities.id foreign key', async () => {
    const db = app.get(DatabaseService).db;
    const dependencies = await fetchActivityForeignKeyDependencies(db);

    expect(dependencies.length).toBeGreaterThan(0);
    assertActivityHardDeleteSchemaCoverage(dependencies);
  });
});
