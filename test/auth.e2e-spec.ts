import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Authentication E2E Tests', () => {
  let app: INestApplication;
  let authToken: string;
  let refreshToken: string;
  let userId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          username: 'e2e_testuser',
          email: 'e2e@test.com',
          phone: '+1234567890',
          fullName: 'E2E Test User',
          password: 'TestPassword123!',
          roles: ['supervisor'],
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('username', 'e2e_testuser');
          expect(res.body).not.toHaveProperty('password');
          userId = res.body.id;
        });
    });

    it('should fail to register with duplicate username', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          username: 'e2e_testuser',
          email: 'different@test.com',
          phone: '+9876543210',
          fullName: 'Another User',
          password: 'TestPassword123!',
        })
        .expect(400);
    });

    it('should fail with invalid email format', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          username: 'newuser',
          email: 'invalid-email',
          phone: '+1111111111',
          fullName: 'New User',
          password: 'password123',
        })
        .expect(400);
    });

    it('should fail with short password', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          username: 'newuser2',
          email: 'new2@test.com',
          phone: '+2222222222',
          fullName: 'New User 2',
          password: '123',
        })
        .expect(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    // First, activate the user directly in DB for testing (normally done by admin)
    beforeAll(async () => {
      // This would require database access to activate the user
      // In a real e2e test, you'd use a test database and activate the user
    });

    it('should fail to login with inactive account', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          username: 'e2e_testuser',
          password: 'TestPassword123!',
        })
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toContain('not active');
        });
    });

    it('should fail with wrong password', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          username: 'e2e_testuser',
          password: 'WrongPassword123!',
        })
        .expect(401);
    });

    it('should fail with non-existent user', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          username: 'nonexistent_user',
          password: 'password123',
        })
        .expect(401);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should fail without authentication token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .expect(401);
    });

    it('should fail with invalid token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should fail with invalid refresh token', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: 'invalid-refresh-token',
        })
        .expect(401);
    });
  });
});
