import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import {
  createMockActivityRequest,
  createMockUpdateRequest,
} from './test-helpers';

describe('ActivitiesController (e2e)', () => {
  let app: INestApplication;
  let createdActivityId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // Apply the same pipes as in main.ts
    app.useGlobalPipes(new ValidationPipe());

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/activities (POST)', () => {
    it('should create a new activity', () => {
      const createActivityDto = createMockActivityRequest({
        title: 'E2E Test Activity',
        summary: 'This is a test activity created via E2E tests',
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
        .expect(400);
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
        .query({ title: 'E2E Test' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(res.body).toHaveProperty('data');
          expect(Array.isArray(res.body.data)).toBe(true);
          // All returned activities should have the search term in their title
          res.body.data.forEach((activity: any) => {
            expect(activity.title.toLowerCase()).toContain('e2e test');
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
      return request(app.getHttpServer()).get('/activities/999999').expect(404);
    });

    it('should return 400 for invalid ID format', () => {
      return request(app.getHttpServer())
        .get('/activities/invalid-id')
        .expect(400);
    });
  });

  describe('/activities/:id (PATCH)', () => {
    it('should update an activity', () => {
      const updateDto = createMockUpdateRequest({
        title: 'Updated E2E Test Activity',
        summary: 'This activity has been updated via E2E tests',
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
        .expect(404);
    });

    it('should return 400 for invalid update data', () => {
      const invalidDto = {
        isAllDay: 'not-a-boolean', // Should be boolean
      };

      return request(app.getHttpServer())
        .patch(`/activities/${createdActivityId}`)
        .send(invalidDto)
        .expect(400);
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
        .expect(404);
    });

    it('should return 404 when fetching deleted activity', () => {
      return request(app.getHttpServer())
        .get(`/activities/${createdActivityId}`)
        .expect(404);
    });
  });
});
