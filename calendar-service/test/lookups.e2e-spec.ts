import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AppModule } from '../src/app.module';
import { createAuthRequest, e2eLogin } from './test-helpers';

describe('LookupsController (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    accessToken = await e2eLogin(app);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/lookups/categories (GET)', () => {
    it('should return all categories', () => {
      return createAuthRequest(app, accessToken)
        .get('/lookups/categories')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(res.body).toHaveProperty('data');
          expect(Array.isArray(res.body.data)).toBe(true);

          // Verify structure of category items
          if (res.body.data.length > 0) {
            expect(res.body.data[0]).toHaveProperty('id');
            expect(res.body.data[0]).toHaveProperty('label');
          }
        });
    });

    it('should have cache-control headers', () => {
      return createAuthRequest(app, accessToken)
        .get('/lookups/categories')
        .expect(200)
        .expect('Cache-Control', /public/);
    });
  });

  describe('/lookups/organizations (GET)', () => {
    it('should return all organizations', () => {
      return createAuthRequest(app, accessToken)
        .get('/lookups/organizations')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(res.body).toHaveProperty('data');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('should filter organizations by userId', () => {
      return createAuthRequest(app, accessToken)
        .get('/lookups/organizations')
        .query({ userId: 1 })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(res.body).toHaveProperty('data');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('should filter organizations by role', () => {
      return createAuthRequest(app, accessToken)
        .get('/lookups/organizations')
        .query({ role: 'admin' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(res.body).toHaveProperty('data');
        });
    });

    it('should filter organizations by organizationId', () => {
      return createAuthRequest(app, accessToken)
        .get('/lookups/organizations')
        .query({ organizationId: 'test-org-id' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(res.body).toHaveProperty('data');
        });
    });
  });

  describe('/lookups/users (GET)', () => {
    it('should return all users', () => {
      return createAuthRequest(app, accessToken)
        .get('/lookups/users')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(res.body).toHaveProperty('data');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });
  });

  describe('/lookups/activity-statuses (GET)', () => {
    it('should return all activity statuses', () => {
      return createAuthRequest(app, accessToken)
        .get('/lookups/activity-statuses')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(res.body).toHaveProperty('data');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });
  });

  describe('/lookups/pitch-statuses (GET)', () => {
    it('should return all pitch statuses', () => {
      return createAuthRequest(app, accessToken)
        .get('/lookups/pitch-statuses')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(res.body).toHaveProperty('data');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });
  });

  describe('Lookup Response Structure', () => {
    it('should return consistent structure across all lookup endpoints', async () => {
      const endpoints = [
        '/lookups/categories',
        '/lookups/organizations',
        '/lookups/users',
        '/lookups/activity-statuses',
        '/lookups/pitch-statuses',
      ];

      for (const endpoint of endpoints) {
        const response = await createAuthRequest(app, accessToken)
          .get(endpoint)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(Array.isArray(response.body.data)).toBe(true);

        // If data exists, verify each item has id and label
        if (response.body.data.length > 0) {
          response.body.data.forEach((item: any) => {
            expect(item).toHaveProperty('id');
            expect(item).toHaveProperty('label');
          });
        }
      }
    });
  });
});
