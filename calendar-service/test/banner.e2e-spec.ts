import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { createAuthRequest, e2eLogin } from './test-helpers';

describe('BannerController (API integration)', () => {
  let app: INestApplication;
  let nonAdminToken: string;
  let systemAdminToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();

    // default seeded admin user (role_id: 5)
    nonAdminToken = await e2eLogin(app, 'thomas.garcia');
    // seeded system admin user (role_id: 6)
    systemAdminToken = await e2eLogin(app, 'daniel.robinson');
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns 403 when non-system-admin attempts to upsert banner settings', async () => {
    const body = {
      isActive: true,
      content: '<p>test</p>',
      backgroundColor: '#ffffff',
      textColor: '#000000',
      isDismissible: true,
      startDateTime: null,
      endDateTime: null,
    };

    await createAuthRequest(app, nonAdminToken)
      .put('/banner/settings')
      .send(body)
      .expect(403);
  });

  it('allows system admin to upsert banner settings', async () => {
    const body = {
      isActive: true,
      content: '<p>system admin test</p>',
      backgroundColor: '#ffffff',
      textColor: '#000000',
      isDismissible: true,
      startDateTime: null,
      endDateTime: null,
    };

    const res = await createAuthRequest(app, systemAdminToken)
      .put('/banner/settings')
      .send(body)
      .expect(200);

    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('content', body.content);
  });
});
