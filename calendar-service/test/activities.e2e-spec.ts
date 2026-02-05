/**
 * Activities API integration tests.
 *
 * These tests run the full Nest app in-process and exercise the HTTP layer
 * (controllers, filters, pipes, services, database) via supertest. They are
 * integration tests, not strict e2e (no deployed service or real network).
 * The "e2e" naming follows Nest convention for full request/response tests.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import {
  createMockActivityRequest,
  createMockUpdateRequest,
} from './test-helpers';

/** UUID v4 pattern per RFC 4122 */
const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function expectProblemDetails(
  res: {
    status: number;
    headers: Record<string, string>;
    body: Record<string, unknown>;
  },
  status: number
): void {
  expect(res.status).toBe(status);
  expect(res.headers['content-type']).toMatch(/application\/problem\+json/);
  expect(res.body).toMatchObject({
    type: expect.any(String),
    title: expect.any(String),
    status,
    detail: expect.any(String),
    instance: expect.any(String),
    correlationId: expect.any(String),
    timestamp: expect.any(String),
  });
  const correlationId = res.headers['x-correlation-id'];
  if (correlationId) {
    expect(correlationId).toMatch(UUID_V4_REGEX);
  }
}

function expectValidationErrors(res: {
  body: { errors?: Array<{ path?: string; message?: string }> };
}): void {
  expect(Array.isArray(res.body.errors)).toBe(true);
  expect(res.body.errors!.length).toBeGreaterThan(0);
  res.body.errors!.forEach((err) => {
    expect(err).toHaveProperty('path');
    expect(err).toHaveProperty('message');
  });
}

describe('ActivitiesController (API integration)', () => {
  let app: INestApplication;
  let createdActivityId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/activities (POST)', () => {
    it('should create a new activity', () => {
      const createActivityDto = createMockActivityRequest({
        title: 'Integration Test Activity',
        summary: 'This is a test activity created via API integration tests',
      });

      return request(app.getHttpServer())
        .post('/activities')
        .send(createActivityDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(res.body).toHaveProperty('data');
          expect(res.body.data).toHaveProperty('id');
          expect(res.body.data).toHaveProperty(
            'title',
            createActivityDto.title
          );
          expect(res.body.data).toHaveProperty(
            'summary',
            createActivityDto.summary
          );

          // Store the created activity ID for later tests
          createdActivityId = res.body.data.id;
        });
    });

    it('should return 400 for invalid activity data', () => {
      const invalidDto = {
        // Missing required fields
        summary: 'Invalid activity',
      };

      return request(app.getHttpServer())
        .post('/activities')
        .send(invalidDto)
        .expect(400)
        .expect((res) => {
          expectProblemDetails(res, 400);
          expectValidationErrors(res);
          expect(res.headers['x-correlation-id']).toMatch(UUID_V4_REGEX);
        });
    });
  });

  describe('/activities (GET)', () => {
    it('should return all activities', () => {
      return request(app.getHttpServer())
        .get('/activities')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(res.body).toHaveProperty('data');
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.data.length).toBeGreaterThan(0);
        });
    });

    it('should filter activities by title', () => {
      return request(app.getHttpServer())
        .get('/activities')
        .query({ title: 'Integration Test' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(res.body).toHaveProperty('data');
          expect(Array.isArray(res.body.data)).toBe(true);
          // All returned activities should have the search term in their title
          res.body.data.forEach((activity: any) => {
            expect(activity.title.toLowerCase()).toContain('integration test');
          });
        });
    });

    it('should filter activities by date range', () => {
      return request(app.getHttpServer())
        .get('/activities')
        .query({
          startDateFrom: '2025-01-01',
          startDateTo: '2025-12-31',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(res.body).toHaveProperty('data');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });
  });

  describe('/activities/categories (GET)', () => {
    it('should return all activity categories', () => {
      return request(app.getHttpServer())
        .get('/activities/categories')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(res.body).toHaveProperty('data');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('should return X-Correlation-ID header (UUID v4) when not provided', () => {
      return request(app.getHttpServer())
        .get('/activities/categories')
        .expect(200)
        .expect((res) => {
          expect(res.headers['x-correlation-id']).toBeDefined();
          expect(res.headers['x-correlation-id']).toMatch(UUID_V4_REGEX);
        });
    });

    it('should echo X-Correlation-ID when provided', () => {
      const uuid = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';
      return request(app.getHttpServer())
        .get('/activities/categories')
        .set('X-Correlation-ID', uuid)
        .expect(200)
        .expect((res) => {
          expect(res.headers['x-correlation-id']).toBe(uuid);
        });
    });
  });

  describe('/activities/:id (GET)', () => {
    it('should return a specific activity by ID', () => {
      return request(app.getHttpServer())
        .get(`/activities/${createdActivityId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(res.body).toHaveProperty('data');
          expect(res.body.data).toHaveProperty('id', createdActivityId);
          expect(res.body.data).toHaveProperty('title');
        });
    });

    it('should return 404 for non-existent activity', () => {
      return request(app.getHttpServer())
        .get('/activities/999999')
        .expect(404)
        .expect((res) => {
          expectProblemDetails(res, 404);
          expect(res.headers['x-correlation-id']).toMatch(UUID_V4_REGEX);
        });
    });

    it('should return 400 for invalid ID format', () => {
      return request(app.getHttpServer())
        .get('/activities/invalid-id')
        .expect(400)
        .expect((res) => {
          expectProblemDetails(res, 400);
          expect(res.headers['x-correlation-id']).toMatch(UUID_V4_REGEX);
        });
    });
  });

  describe('/activities/:id (PATCH)', () => {
    it('should update an activity', () => {
      const updateDto = createMockUpdateRequest({
        title: 'Updated Integration Test Activity',
        summary: 'This activity has been updated via API integration tests',
      });

      return request(app.getHttpServer())
        .patch(`/activities/${createdActivityId}`)
        .send(updateDto)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(res.body).toHaveProperty('data');
          expect(res.body.data).toHaveProperty('id', createdActivityId);
          expect(res.body.data).toHaveProperty('title', updateDto.title);
          expect(res.body.data).toHaveProperty('summary', updateDto.summary);
        });
    });

    it('should return 404 when updating non-existent activity', () => {
      const updateDto = createMockUpdateRequest({
        title: 'Updated Title',
      });

      return request(app.getHttpServer())
        .patch('/activities/999999')
        .send(updateDto)
        .expect(404)
        .expect((res) => {
          expectProblemDetails(res, 404);
          expect(res.headers['x-correlation-id']).toMatch(UUID_V4_REGEX);
        });
    });

    it('should return 400 for invalid update data', () => {
      const invalidDto = {
        isAllDay: 'not-a-boolean', // Should be boolean
      };

      return request(app.getHttpServer())
        .patch(`/activities/${createdActivityId}`)
        .send(invalidDto)
        .expect(400)
        .expect((res) => {
          expectProblemDetails(res, 400);
          expect(res.headers['x-correlation-id']).toMatch(UUID_V4_REGEX);
          if (Array.isArray(res.body.errors) && res.body.errors.length > 0) {
            expectValidationErrors(res);
          }
        });
    });
  });

  describe('/activities/:id (DELETE)', () => {
    it('should delete an activity', () => {
      return request(app.getHttpServer())
        .delete(`/activities/${createdActivityId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body.message).toContain('deleted');
        });
    });

    it('should return 404 when deleting non-existent activity', () => {
      return request(app.getHttpServer())
        .delete('/activities/999999')
        .expect(404)
        .expect((res) => {
          expectProblemDetails(res, 404);
          expect(res.headers['x-correlation-id']).toMatch(UUID_V4_REGEX);
        });
    });

    it('should return 404 when fetching deleted activity', () => {
      return request(app.getHttpServer())
        .get(`/activities/${createdActivityId}`)
        .expect(404)
        .expect((res) => {
          expectProblemDetails(res, 404);
          expect(res.headers['x-correlation-id']).toMatch(UUID_V4_REGEX);
        });
    });
  });
});
