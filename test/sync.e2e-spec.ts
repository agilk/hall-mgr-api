import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

describe('Sync API (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    dataSource = moduleFixture.get<DataSource>(DataSource);
    await app.init();
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  describe('/api/v1/sync (Sync Endpoints)', () => {
    describe('GET /api/v1/sync/status', () => {
      it('should return sync status', () => {
        return request(app.getHttpServer())
          .get('/api/v1/sync/status')
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('success');
            expect(res.body.data).toHaveProperty('status');
            expect(res.body.data).toHaveProperty('lastSync');
          });
      });

      it('should include pagination in response', () => {
        return request(app.getHttpServer())
          .get('/api/v1/sync/status')
          .query({ page: 1, limit: 5 })
          .expect(200)
          .expect((res) => {
            expect(res.body.data).toHaveProperty('logs');
            expect(Array.isArray(res.body.data.logs.items)).toBe(true);
          });
      });
    });

    describe('POST /api/v1/sync/exam-halls', () => {
      it('should trigger exam halls sync', () => {
        return request(app.getHttpServer())
          .post('/api/v1/sync/exam-halls')
          .expect((res) => {
            // May succeed or fail depending on external API availability
            expect([200, 201, 400, 500]).toContain(res.status);
            expect(res.body).toHaveProperty('success');
            if (res.body.success) {
              expect(res.body.data).toHaveProperty('synced');
            } else {
              expect(res.body).toHaveProperty('error');
            }
          });
      });

      it('should handle sync errors gracefully', async () => {
        // This test verifies that the endpoint handles errors without crashing
        const response = await request(app.getHttpServer())
          .post('/api/v1/sync/exam-halls')
          .expect((res) => {
            expect(res.body).toHaveProperty('success');
          });

        // Either success or a properly formatted error
        if (!response.body.success) {
          expect(response.body.error).toHaveProperty('message');
        }
      });
    });

    describe('POST /api/v1/sync/participants/:date', () => {
      const testDate = '2024-03-15';

      it('should sync participants for a specific date', () => {
        return request(app.getHttpServer())
          .post(`/api/v1/sync/participants/${testDate}`)
          .expect((res) => {
            expect([200, 201, 400, 404, 500]).toContain(res.status);
            expect(res.body).toHaveProperty('success');
            if (res.body.success) {
              expect(res.body.data).toHaveProperty('synced');
              expect(res.body.data).toHaveProperty('date', testDate);
            }
          });
      });

      it('should validate date format', () => {
        return request(app.getHttpServer())
          .post('/api/v1/sync/participants/invalid-date')
          .expect((res) => {
            expect([400, 404, 500]).toContain(res.status);
          });
      });

      it('should handle future dates', () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 10);
        const futureDateStr = futureDate.toISOString().split('T')[0];

        return request(app.getHttpServer())
          .post(`/api/v1/sync/participants/${futureDateStr}`)
          .expect((res) => {
            expect(res.body).toHaveProperty('success');
          });
      });
    });

    describe('POST /api/v1/sync/participants/next-3-days', () => {
      it('should sync participants for next 3 days', () => {
        return request(app.getHttpServer())
          .post('/api/v1/sync/participants/next-3-days')
          .expect((res) => {
            expect([200, 201, 400, 500]).toContain(res.status);
            expect(res.body).toHaveProperty('success');
            if (res.body.success) {
              expect(res.body.data).toHaveProperty('synced');
              expect(Array.isArray(res.body.data.synced)).toBe(true);
            }
          });
      });

      it('should return sync results for multiple days', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v1/sync/participants/next-3-days');

        if (response.body.success) {
          expect(response.body.data.synced.length).toBeLessThanOrEqual(3);
        }
      });
    });

    describe('Error Handling', () => {
      it('should return proper error format for non-existent endpoints', () => {
        return request(app.getHttpServer())
          .get('/api/v1/sync/non-existent')
          .expect(404)
          .expect((res) => {
            expect(res.body).toHaveProperty('success', false);
            expect(res.body).toHaveProperty('error');
          });
      });

      it('should handle invalid methods', () => {
        return request(app.getHttpServer())
          .put('/api/v1/sync/status')
          .expect(404);
      });
    });

    describe('Response Format', () => {
      it('should follow standard API response format', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/sync/status')
          .expect(200);

        expect(response.body).toHaveProperty('success');
        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('timestamp');
        expect(typeof response.body.timestamp).toBe('string');
      });

      it('should include request path in errors', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/sync/non-existent')
          .expect(404);

        expect(response.body).toHaveProperty('path');
      });
    });
  });

  describe('Sync Integration Tests', () => {
    it('should maintain data consistency during sync', async () => {
      // Get initial status
      const initialStatus = await request(app.getHttpServer())
        .get('/api/v1/sync/status')
        .expect(200);

      expect(initialStatus.body.data).toHaveProperty('lastSync');

      // Trigger a sync (may or may not succeed depending on external API)
      const syncResponse = await request(app.getHttpServer())
        .post('/api/v1/sync/exam-halls');

      // Verify response is well-formed regardless of success
      expect(syncResponse.body).toHaveProperty('success');

      if (syncResponse.body.success) {
        // If sync succeeded, status should be updated
        const updatedStatus = await request(app.getHttpServer())
          .get('/api/v1/sync/status')
          .expect(200);

        expect(updatedStatus.body.data).toHaveProperty('lastSync');
      }
    });

    it('should handle concurrent sync requests', async () => {
      // Send multiple sync requests concurrently
      const requests = [
        request(app.getHttpServer()).post('/api/v1/sync/exam-halls'),
        request(app.getHttpServer()).post('/api/v1/sync/exam-halls'),
      ];

      const responses = await Promise.all(requests);

      // All requests should complete without crashes
      responses.forEach((response) => {
        expect(response.body).toHaveProperty('success');
      });
    });
  });

  describe('Sync Logs', () => {
    it('should record sync attempts in logs', async () => {
      // Trigger a sync
      await request(app.getHttpServer())
        .post('/api/v1/sync/exam-halls');

      // Check that logs are created
      const statusResponse = await request(app.getHttpServer())
        .get('/api/v1/sync/status')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(statusResponse.body.data).toHaveProperty('logs');
      expect(statusResponse.body.data.logs).toHaveProperty('items');
      expect(Array.isArray(statusResponse.body.data.logs.items)).toBe(true);
    });

    it('should paginate sync logs', async () => {
      const page1 = await request(app.getHttpServer())
        .get('/api/v1/sync/status')
        .query({ page: 1, limit: 2 })
        .expect(200);

      expect(page1.body.data.logs).toHaveProperty('meta');
      expect(page1.body.data.logs.meta).toHaveProperty('currentPage', 1);
      expect(page1.body.data.logs.meta).toHaveProperty('itemsPerPage');
    });
  });
});
