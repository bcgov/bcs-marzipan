import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { createAuthRequest, e2eLogin } from './test-helpers';

describe('Banner API permissions', () => {
  let app: INestApplication;
  let nonAdminToken: string;
  let systemAdminToken: string;

  const upsertBody = {
    isActive: true,
    content: '<p>test</p>',
    backgroundColor: '#ffffff',
    textColor: '#000000',
    isDismissible: true,
    startDateTime: null,
    endDateTime: null,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();

    nonAdminToken = await e2eLogin(app, 'thomas.garcia');
    systemAdminToken = await e2eLogin(app, 'daniel.robinson');
  });

  afterAll(async () => {
    await app.close();
  });

  it('forbids non-admin users from updating banner', async () => {
    await createAuthRequest(app, nonAdminToken)
      .put('/banner/settings')
      .send(upsertBody)
      .expect(403);
  });

  it('allows system admins to update banner', async () => {
    const res = await createAuthRequest(app, systemAdminToken)
      .put('/banner/settings')
      .send(upsertBody)
      .expect(200);

    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
  });
});
