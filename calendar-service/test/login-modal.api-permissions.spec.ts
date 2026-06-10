import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { createAuthRequest, e2eLogin } from './test-helpers';

describe('Login modal API permissions', () => {
  let app: INestApplication;
  let nonAdminToken: string;
  let systemAdminToken: string;

  const upsertBody = {
    isActive: true,
    title: 'Test Notice',
    content: 'This is a test notice.',
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

  describe('GET /login-modal', () => {
    it('returns active modal (or null) for authenticated users', async () => {
      const res = await createAuthRequest(app, nonAdminToken)
        .get('/login-modal')
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
    });
  });

  describe('GET /login-modal/settings', () => {
    it('allows users with SETTINGS.VIEW permission to read settings', async () => {
      const res = await createAuthRequest(app, systemAdminToken)
        .get('/login-modal/settings')
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
    });
  });

  describe('PUT /login-modal/settings', () => {
    it('forbids non-admin users from updating login modal settings', async () => {
      await createAuthRequest(app, nonAdminToken)
        .put('/login-modal/settings')
        .send(upsertBody)
        .expect(403);
    });

    it('allows system admins to update login modal settings', async () => {
      const res = await createAuthRequest(app, systemAdminToken)
        .put('/login-modal/settings')
        .send(upsertBody)
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('title', upsertBody.title);
      expect(res.body.data).toHaveProperty('content', upsertBody.content);
      expect(res.body.data).toHaveProperty('isActive', upsertBody.isActive);
    });
  });
});
